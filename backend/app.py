from __future__ import annotations

import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Literal

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import GenerationConfig, pipeline

# Force HuggingFace to stay offline — use local models only
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

DEFAULT_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "ai",
    "models--Ocean82--lyrics-generator",
)


class Colors(BaseModel):
    primary: str = ""
    secondary: str = ""


class GenerateRequest(BaseModel):
    sport: str
    schoolMascot: str
    competitorMascot: str
    stanzas: int = Field(ge=1, le=6)
    linesPerStanza: int = Field(ge=2, le=6)
    colors: Colors


class GenerateResponse(BaseModel):
    chant: str
    source: Literal["ocean82-lyrics-generator"]


def _line_cleanup(line: str) -> str:
    line = line.strip()
    line = re.sub(r"^\s*[-*•]+\s*", "", line)
    line = re.sub(r"^\s*\d+[.)]\s*", "", line)
    line = re.sub(r"^\s*\[[^\]]+\]\s*", "", line)
    return line.strip()


def _normalize_output(text: str, stanzas: int, lines_per_stanza: int) -> str:
    text = text.replace("\r\n", "\n").strip()
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text) if b.strip()]
    if len(blocks) != stanzas:
        raise ValueError(f"Expected {stanzas} stanzas, got {len(blocks)}")

    normalized: list[str] = []
    for block in blocks:
        lines = [_line_cleanup(ln) for ln in block.split("\n")]
        lines = [ln for ln in lines if ln]
        if len(lines) != lines_per_stanza:
            raise ValueError(
                f"Expected {lines_per_stanza} " f"lines/stanza, got {len(lines)}"
            )
        normalized.append("\n".join(lines))

    return "\n\n".join(normalized)


def _is_usable_line(line: str) -> bool:
    """Filter out lines too short or non-lyric noise."""
    if len(line) < 4:
        return False
    return not re.fullmatch(r"[.!?,;:\-\u2013\u2014\s]+", line)


def _deduplicate_consecutive(lines: list[str]) -> list[str]:
    """Remove consecutive duplicate lines."""
    if not lines:
        return lines
    result = [lines[0]]
    for line in lines[1:]:
        if line.lower().strip() != result[-1].lower().strip():
            result.append(line)
    return result


def _coerce_output_shape(text: str, stanzas: int, lines_per_stanza: int) -> str:
    """Clean, deduplicate, then fit to requested structure."""
    raw = text.replace("\r\n", "\n").split("\n")
    cleaned_lines = [_line_cleanup(ln) for ln in raw]
    cleaned_lines = [ln for ln in cleaned_lines if _is_usable_line(ln)]
    cleaned_lines = _deduplicate_consecutive(cleaned_lines)
    target_lines = stanzas * lines_per_stanza

    if not cleaned_lines:
        cleaned_lines = ["Let's go team!"]

    if len(cleaned_lines) < target_lines:
        base = list(cleaned_lines)
        idx = 0
        while len(cleaned_lines) < target_lines:
            cleaned_lines.append(base[idx % len(base)])
            idx += 1
    else:
        cleaned_lines = cleaned_lines[:target_lines]

    stanza_chunks: list[str] = []
    for stanza_idx in range(stanzas):
        start = stanza_idx * lines_per_stanza
        end = start + lines_per_stanza
        stanza_chunks.append("\n".join(cleaned_lines[start:end]))
    return "\n\n".join(stanza_chunks)


def _color_phrase(colors: Colors) -> str:
    primary = colors.primary.strip()
    secondary = colors.secondary.strip()
    if primary and secondary:
        return f"{primary} and {secondary}"
    if primary:
        return primary
    return secondary if secondary else "our colors"


def _build_prompt(req: GenerateRequest) -> str:
    """Build a continuation-style seed for Ocean82.

    Ocean82 is a lyrics continuation model, not an
    instruction follower. We give it context as a natural
    lyric opening and let it generate freely. Structure
    enforcement happens in post-processing.
    """
    color_ph = _color_phrase(req.colors)
    school = req.schoolMascot.strip()
    competitor = req.competitorMascot.strip()
    sport = req.sport.strip()

    return (
        f"{sport} cheer chant, "
        f"{school} vs {competitor}, {color_ph}:\n\n"
        f"Go {school}! "
    )


@lru_cache(maxsize=1)
def get_generator():
    configured_path = os.getenv("CHEER_MODEL_PATH", DEFAULT_MODEL_PATH)
    model_path = Path(configured_path)
    if not model_path.exists():
        raise RuntimeError(
            f"Model path not found: {configured_path}. "
            "Set CHEER_MODEL_PATH to a valid path."
        )

    # Support HF cache root (models--.../snapshots/<hash>).
    if (model_path / "snapshots").is_dir():
        snapshots = sorted(
            [p for p in (model_path / "snapshots").iterdir() if p.is_dir()],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not snapshots:
            raise RuntimeError(
                "No snapshots found under: " f"{model_path / 'snapshots'}"
            )
        model_path = snapshots[0]

    config_path = model_path / "config.json"
    if not config_path.exists():
        raise RuntimeError("Missing config.json in model path: " f"{model_path}")

    return pipeline(
        task="text-generation",
        model=str(model_path),
        tokenizer=str(model_path),
        device=-1,
        dtype=torch.float32,
    )


app = FastAPI(title="Cheer Local AI Server", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Cheer Local AI Server running." " Use POST /generate-chant"}


@app.post("/generate-chant", response_model=GenerateResponse)
def generate_chant(req: GenerateRequest) -> GenerateResponse:
    try:
        generator = get_generator()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Model load failed: {exc}",
        ) from exc

    prompt = _build_prompt(req)
    target_lines = req.stanzas * req.linesPerStanza
    # Overshoot tokens — Ocean82 produces ~1 line per
    # 8-12 tokens. We trim in post-processing.
    max_new_tokens = max(128, target_lines * 20)

    all_lines: list[str] = []
    for temperature in (0.85, 0.7, 0.95):
        try:
            gen_config = GenerationConfig(
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=temperature,
                top_p=0.92,
                repetition_penalty=1.15,
                num_return_sequences=1,
                pad_token_id=generator.tokenizer.eos_token_id,
            )
            output = generator(
                prompt,
                generation_config=gen_config,
                return_full_text=False,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Inference failed: {exc}",
            ) from exc

        text = output[0]["generated_text"].strip()

        # Try strict parse (unlikely but free win)
        try:
            chant = _normalize_output(text, req.stanzas, req.linesPerStanza)
            return GenerateResponse(
                chant=chant,
                source="ocean82-lyrics-generator",
            )
        except ValueError:
            pass

        # Collect usable lines from this pass
        raw_lines = text.replace("\r\n", "\n").split("\n")
        lines = [_line_cleanup(ln) for ln in raw_lines]
        lines = [ln for ln in lines if _is_usable_line(ln)]
        all_lines.extend(lines)

        # Stop early if we have enough unique material
        deduped = _deduplicate_consecutive(all_lines)
        if len(deduped) >= target_lines:
            break

    # Assemble final output from collected lines
    chant = _coerce_output_shape(
        "\n".join(all_lines),
        req.stanzas,
        req.linesPerStanza,
    )
    return GenerateResponse(chant=chant, source="ocean82-lyrics-generator")


# -------------------------------------------------------------------
# Creative generation via Llama-Song-Stream-3B (instruction-tuned)
# -------------------------------------------------------------------

LLAMA_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "ai",
    "Llama-Song-Stream-3B-Instruct-GGUF",
    "Llama-Song-Stream-3B-Instruct-Q4_K_S.gguf",
)


class CreativeRequest(BaseModel):
    sport: str
    schoolMascot: str
    competitorMascot: str = ""
    stanzas: int = Field(ge=1, le=6)
    linesPerStanza: int = Field(ge=2, le=6)
    colors: Colors
    style: str = "standard"


class CreativeResponse(BaseModel):
    chant: str
    source: Literal["llama-song-stream-3b"]


@lru_cache(maxsize=1)
def get_llama_model():
    from llama_cpp import Llama

    model_path = os.getenv("CREATIVE_MODEL_PATH", LLAMA_MODEL_PATH)
    if not os.path.exists(model_path):
        raise RuntimeError(
            f"Llama model not found: {model_path}." " Set CREATIVE_MODEL_PATH env var."
        )
    return Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=os.cpu_count() or 4,
        verbose=False,
    )


def _build_creative_prompt(req: CreativeRequest) -> str:
    """Build an instruction prompt for the 3B model.

    Unlike Ocean82, this model can follow instructions,
    so we ask for specific creative qualities.
    """
    color_ph = _color_phrase(req.colors)
    school = req.schoolMascot.strip()
    competitor = req.competitorMascot.strip()
    sport = req.sport.strip()
    total = req.stanzas * req.linesPerStanza

    style_guidance = ""
    if req.style == "call_and_response":
        style_guidance = (
            "Use call-and-response format with " "LEADER: and CROWD: prefixes.\n"
        )
    elif req.style == "aggressive":
        style_guidance = (
            "Make it bold and intimidating. " "Use ALL CAPS for emphasis lines.\n"
        )

    rival_line = ""
    if competitor:
        rival_line = (
            f"The rival team is the {competitor}. " "Include playful trash talk.\n"
        )

    return (
        f"Write a creative {sport} cheer chant "
        f"for the {school}.\n"
        f"School colors: {color_ph}.\n"
        f"{rival_line}"
        f"{style_guidance}"
        "Requirements:\n"
        f"- Exactly {req.stanzas} stanzas, "
        f"{req.linesPerStanza} lines each\n"
        f"- {total} lines total\n"
        "- Use wordplay, internal rhyme, and "
        "clever phrasing\n"
        "- Vary rhythm — mix short punchy lines "
        "with flowing ones\n"
        "- Make it sound natural when shouted by "
        "a crowd in unison\n"
        "- Include the team name and colors "
        "naturally\n"
        "- No titles, labels, numbering, or "
        "explanation\n"
        "- Separate stanzas with one blank line\n"
        "\nChant:\n"
    )


@app.post(
    "/generate-creative",
    response_model=CreativeResponse,
)
def generate_creative(
    req: CreativeRequest,
) -> CreativeResponse:
    try:
        llm = get_llama_model()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Creative model load failed: {exc}",
        ) from exc

    prompt = _build_creative_prompt(req)
    target_lines = req.stanzas * req.linesPerStanza
    max_tokens = max(200, target_lines * 25)

    try:
        output = llm(
            prompt,
            max_tokens=max_tokens,
            temperature=0.85,
            top_p=0.92,
            repeat_penalty=1.12,
            stop=["\n\n\n", "---", "Note:", "###"],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Creative inference failed: {exc}",
        ) from exc

    text = output["choices"][0]["text"].strip()

    # Try strict parse first
    try:
        chant = _normalize_output(text, req.stanzas, req.linesPerStanza)
        return CreativeResponse(
            chant=chant,
            source="llama-song-stream-3b",
        )
    except ValueError:
        pass

    # Coerce to shape if strict parse fails
    chant = _coerce_output_shape(text, req.stanzas, req.linesPerStanza)
    return CreativeResponse(chant=chant, source="llama-song-stream-3b")

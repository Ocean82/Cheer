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
from transformers import pipeline

DEFAULT_MODEL_PATH = r"D:\MY-MODELS\models--Ocean82--lyrics-generator"


class Colors(BaseModel):
    primary: str = ""
    secondary: str = ""


class GenerateRequest(BaseModel):
    sport: str
    schoolMascot: str
    competitorMascot: str
    stanzas: int = Field(ge=1, le=14)
    linesPerStanza: int = Field(ge=2, le=14)
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
        lines = [_line_cleanup(line) for line in block.split("\n")]
        lines = [line for line in lines if line]
        if len(lines) != lines_per_stanza:
            raise ValueError(
                f"Expected {lines_per_stanza} lines per stanza, got {len(lines)}"
            )
        normalized.append("\n".join(lines))

    return "\n\n".join(normalized)


def _coerce_output_shape(text: str, stanzas: int, lines_per_stanza: int) -> str:
    """Best-effort reshape when strict parsing fails."""
    cleaned_lines = [_line_cleanup(line) for line in text.replace("\r\n", "\n").split("\n")]
    cleaned_lines = [line for line in cleaned_lines if line]
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
    for s in range(stanzas):
        start = s * lines_per_stanza
        end = start + lines_per_stanza
        stanza_chunks.append("\n".join(cleaned_lines[start:end]))
    return "\n\n".join(stanza_chunks)


def _color_phrase(colors: Colors) -> str:
    p = colors.primary.strip()
    s = colors.secondary.strip()
    if p and s:
        return f"{p} and {s}"
    if p:
        return p
    if s:
        return s
    return "our colors"


def _build_prompt(req: GenerateRequest) -> str:
    color_phrase = _color_phrase(req.colors)
    return (
        "Write a school-friendly cheer chant.\\n"
        "Strict rules (must follow exactly):\\n"
        f"- Output exactly {req.stanzas} stanzas.\\n"
        f"- Each stanza must have exactly {req.linesPerStanza} lines.\\n"
        "- Put exactly one blank line between stanzas.\\n"
        "- Do not add titles, labels, numbering, markdown, bullets, or explanation.\\n"
        "- Keep lines chant-ready, energetic, and family-friendly.\\n"
        "- Keep each line short (roughly 5-11 words).\\n"
        "- Mention the school mascot and competitor mascot naturally.\\n"
        f"- Include school colors phrase: {color_phrase}.\\n"
        "- Keep it suitable for live crowd chanting.\\n"
        "Context:\\n"
        f"Sport: {req.sport}\\n"
        f"School mascot: {req.schoolMascot}\\n"
        f"Competitor mascot: {req.competitorMascot}\\n"
        f"School colors: {color_phrase}\\n"
        "Output only the chant text."
    )


@lru_cache(maxsize=1)
def get_generator():
    configured_path = os.getenv("CHEER_MODEL_PATH", DEFAULT_MODEL_PATH)
    model_path = Path(configured_path)
    if not model_path.exists():
        raise RuntimeError(
            f"Model path not found: {configured_path}. Set CHEER_MODEL_PATH to a valid path."
        )

    # Support pointing to HF cache root (models--.../snapshots/<hash>).
    if (model_path / "snapshots").is_dir():
        snapshots = sorted(
            [p for p in (model_path / "snapshots").iterdir() if p.is_dir()],
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not snapshots:
            raise RuntimeError(f"No snapshots found under: {model_path / 'snapshots'}")
        model_path = snapshots[0]

    config_path = model_path / "config.json"
    if not config_path.exists():
        raise RuntimeError(f"Missing config.json in model path: {model_path}")

    return pipeline(
        task="text-generation",
        model=str(model_path),
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
    return {"message": "Cheer Local AI Server running. Use POST /generate-chant"}


@app.post("/generate-chant", response_model=GenerateResponse)
def generate_chant(req: GenerateRequest) -> GenerateResponse:
    try:
        generator = get_generator()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model load failed: {exc}") from exc

    prompt = _build_prompt(req)
    max_new_tokens = max(96, min(384, req.stanzas * req.linesPerStanza * 12))

    candidates: list[str] = []
    last_text = ""
    for temperature in (0.8, 0.65):
        try:
            output = generator(
                prompt,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=temperature,
                top_p=0.9,
                repetition_penalty=1.08,
                return_full_text=False,
                num_return_sequences=1,
                pad_token_id=generator.tokenizer.eos_token_id,
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc
        text = output[0]["generated_text"].strip()
        last_text = text
        candidates.append(text)

        try:
            chant = _normalize_output(text, req.stanzas, req.linesPerStanza)
            return GenerateResponse(chant=chant, source="ocean82-lyrics-generator")
        except ValueError:
            continue

    # Preserve UX by coercing to exact requested structure if strict parsing fails.
    chant = _coerce_output_shape(last_text or "\n".join(candidates), req.stanzas, req.linesPerStanza)
    return GenerateResponse(chant=chant, source="ocean82-lyrics-generator")

const CHANT_TEMPLATES: Record<string, (school: string, competitor: string) => string[]> = {
  Football: (school, competitor) => [
    `${school} team, moving down the field,`,
    `Defense is strong, we've got the shield!`,
    `First down, second down, go go go!`,
    `The ${competitor} can't stand our might,`,
    `We're charging hard with all our might!`,
    `Touchdown ${school}, we're taking the crown,`,
    `Your defense crumbles when we come to town!`,
    `Go ${school}, unstoppable force,`,
    `The ${competitor} have no choice,`,
    `We dominate the gridiron today,`,
    `Victory's ours, hip hip hooray!`,
    `${school} pride, standing tall and true,`,
    `The ${competitor} wish they were us too!`,
  ],
  
  Basketball: (school, competitor) => [
    `${school} players on the court tonight,`,
    `We're shooting hoops with all our might!`,
    `Fast breaks and dunks, watch us fly,`,
    `The ${competitor} can only watch us glide!`,
    `Swish goes the net, two points for us,`,
    `${school} ball, creating all this fuss!`,
    `Dribble down the court, passing strong,`,
    `Defending like we can't go wrong!`,
    `Fast-paced action, beautiful game,`,
    `The ${competitor} can't handle our fame!`,
    `${school} owns this basketball floor,`,
    `We'll win the game and many more!`,
    `Teamwork and heart, that's our way,`,
    `Victory's ours at the end of the day!`,
  ],
  
  Volleyball: (school, competitor) => [
    `${school} on the net, we're locked in tight,`,
    `Serving up power with all of our might!`,
    `Bump, set, spike, watch us soar,`,
    `The ${competitor} can't even score!`,
    `Block at the net, point for us,`,
    `${school} volleyball, raising the dust!`,
    `Communication keeping us strong,`,
    `Setting up winners all match long!`,
    `Ace after ace, we're on fire today,`,
    `The ${competitor} can't stand our play!`,
    `Rotation perfect, every position set,`,
    `${school} stands strong, we're the best yet!`,
    `Dig that ball and turn it around,`,
    `Victory's here, let the crowd sound!`,
  ],
  
  Soccer: (school, competitor) => [
    `${school} soccer, flowing down the field,`,
    `Passing and moving, we've got the deal!`,
    `Possession moving with skill and with grace,`,
    `The ${competitor} can't keep up our pace!`,
    `Goal! Net bulges, our score goes up,`,
    `${school} soccer lifts the trophy cup!`,
    `Fast feet and hearts beating strong,`,
    `We dominate the field all day long!`,
    `Defensive pressure, winning the ball,`,
    `The ${competitor} feel our call!`,
    `Teamwork and tactics, we execute right,`,
    `${school} soccer shines so bright!`,
    `Together we're champions, breaking through,`,
    `Victory belongs to the red and blue!`,
  ],
  
  Cheerleading: (school, competitor) => [
    `${school} cheerleaders, pyramids high,`,
    `Stunting and tumbling, reaching the sky!`,
    `Synchronized motion, spirit so bright,`,
    `The ${competitor} can't match our might!`,
    `Jumps and flips, shaking those poms,`,
    `${school} cheer, leading the songs!`,
    `Energy pumping through every routine,`,
    `The best cheerleading ever seen!`,
    `Building pyramids, so strong and so tall,`,
    `The ${competitor} watch while we stand proud and tall!`,
    `Competitive spirit burning within,`,
    `Let the winning begin!`,
    `${school} takes it all, competition complete,`,
    `Our cheer is the strongest, we can't be beat!`,
  ],
  
  'Track & Field': (school, competitor) => [
    `${school} runners flying down the track,`,
    `Speed and strength, we've got the knack!`,
    `Sprint to the finish, give it all you got,`,
    `The ${competitor} haven't got what we've got!`,
    `Hurdlers jumping, clearing every bar,`,
    `${school} athletes shining like a star!`,
    `Relays and distance, we dominate,`,
    `The ${competitor} simply cannot compete!`,
    `Field events showing strength and grace,`,
    `We're winning every single race!`,
    `Training hard, pushing to the limit,`,
    `${school} spirit, winning every minute!`,
    `Together we're champions, breaking through,`,
    `The finish line victory belongs to you!`,
  ],
  
  Wrestling: (school, competitor) => [
    `${school} wrestlers stepping on the mat,`,
    `Strength and technique, imagine that!`,
    `Take down the opponent, pin and win,`,
    `The ${competitor} can't beat our skin!`,
    `Grappling together, pure athletic art,`,
    `${school} wrestling, fierce at heart!`,
    `Every match won with courage and pride,`,
    `The ${competitor} have nowhere to hide!`,
    `Discipline and power in every move,`,
    `We've got the skills that prove!`,
    `${school} dominates on the mat,`,
    `Victory's ours, imagine that!`,
    `Champions rising, breaking through,`,
    `The ${competitor} can't match our crew!`,
  ],
  
  Baseball: (school, competitor) => [
    `${school} baseball, stepping up to bat,`,
    `Crack goes the ball, imagine that!`,
    `Rounding the bases, scoring runs,`,
    `The ${competitor} know we're having fun!`,
    `Defense is ready, standing so tall,`,
    `${school} baseball answers the call!`,
    `Teamwork and strategy on display,`,
    `The ${competitor} can't slow our way!`,
    `Pitcher striking out batter by batter,`,
    `Our victories make the scoreboard shatter!`,
    `${school} takes the lead, running strong,`,
    `We'll win this game all day long!`,
    `Champions on the diamond, standing proud,`,
    `Victory's roaring loud!`,
  ],
  
  Softball: (school, competitor) => [
    `${school} softball players, diamonds bright,`,
    `Hitting hard with all of our might!`,
    `Running the bases, scoring with speed,`,
    `The ${competitor} know what we need!`,
    `Fielding with precision, every play,`,
    `${school} softball leading the way!`,
    `Pitcher throwing heat, batter beware,`,
    `The ${competitor} simply can't compare!`,
    `Teamwork and talent on full display,`,
    `We're dominating every play!`,
    `${school} rises above the rest,`,
    `We're simply the best!`,
    `Championships waiting, taking them all,`,
    `${school} owns the softball!`,
  ],
  
  Tennis: (school, competitor) => [
    `${school} tennis players on the court,`,
    `Serving and volleying, giving support!`,
    `Powerful forehands, slicing the air,`,
    `The ${competitor} can never compare!`,
    `Rallying back and forth with pride,`,
    `${school} tennis standing far and wide!`,
    `Net game sharp, baseline strong,`,
    `We're winning matches all day long!`,
    `Competitive fire burning bright,`,
    `${school} shining with all its might!`,
    `Victory after victory, breaking through,`,
    `The ${competitor} can't touch you!`,
    `${school} champions, the champions we'll be,`,
    `Watch us dominate, come and see!`,
  ],
};

export async function generateChant(sport: string, school: string, competitor: string): Promise<string> {
  // Simulate a slight delay to feel like a real API call
  await new Promise((resolve) => setTimeout(resolve, 800));

  const templates = CHANT_TEMPLATES[sport];
  if (!templates) {
    throw new Error(`Sport "${sport}" not supported`);
  }

  const lines = templates(school, competitor);
  
  // Shuffle some lines for variety while keeping good flow
  const chantLines = [...lines];
  
  // Randomly select 10-15 lines to create each unique chant
  const numLines = Math.floor(Math.random() * 6) + 10; // 10-15 lines
  const selectedLines: string[] = [];
  const availableIndices = Array.from({ length: chantLines.length }, (_, i) => i);
  
  for (let i = 0; i < numLines && availableIndices.length > 0; i++) {
    const randomIdx = Math.floor(Math.random() * availableIndices.length);
    selectedLines.push(chantLines[availableIndices[randomIdx]]);
    availableIndices.splice(randomIdx, 1);
  }

  return selectedLines.join('\n');
}

/**
 * Calculates standings for a list of group matches and their predicted scores.
 * 
 * Each match in groupMatches should contain:
 * - team_home (string)
 * - team_away (string)
 * - predicted_home_score (number or null)
 * - predicted_away_score (number or null)
 */
export function calculateGroupStandings(groupMatches) {
  const teams = {};

  // Initialize all teams present in this group's matches
  groupMatches.forEach(m => {
    if (!teams[m.team_home]) {
      teams[m.team_home] = { name: m.team_home, played: 0, goals_for: 0, goals_against: 0, points: 0 };
    }
    if (!teams[m.team_away]) {
      teams[m.team_away] = { name: m.team_away, played: 0, goals_for: 0, goals_against: 0, points: 0 };
    }
  });

  // Calculate statistics from predicted scores
  groupMatches.forEach(m => {
    const hs = m.predicted_home_score;
    const as = m.predicted_away_score;
    
    if (hs !== null && hs !== undefined && hs !== '' && !isNaN(Number(hs)) &&
        as !== null && as !== undefined && as !== '' && !isNaN(Number(as))) {
      const homeScore = Number(hs);
      const awayScore = Number(as);

      teams[m.team_home].played += 1;
      teams[m.team_home].goals_for += homeScore;
      teams[m.team_home].goals_against += awayScore;

      teams[m.team_away].played += 1;
      teams[m.team_away].goals_for += awayScore;
      teams[m.team_away].goals_against += homeScore;

      if (homeScore > awayScore) {
        teams[m.team_home].points += 3;
      } else if (awayScore > homeScore) {
        teams[m.team_away].points += 3;
      } else {
        teams[m.team_home].points += 1;
        teams[m.team_away].points += 1;
      }
    }
  });

  // Convert to array and compute goal difference
  const standings = Object.values(teams).map(t => ({
    ...t,
    gd: t.goals_for - t.goals_against
  }));

  // Sort standings: Points -> GD -> GF -> Alphabetical
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.name.localeCompare(b.name);
  });

  return standings;
}

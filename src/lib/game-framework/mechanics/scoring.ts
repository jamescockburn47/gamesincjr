export class ScoreManager {
  private score: number = 0;
  private highScore: number = 0;
  private streak: number = 0;
  private maxStreak: number = 0;

  constructor(gameSlug?: string) {
    if (typeof window !== 'undefined' && gameSlug) {
      const saved = localStorage.getItem(`${gameSlug}-highscore`);
      if (saved) {
        this.highScore = parseInt(saved, 10);
      }
    }
  }

  addPoints(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  incrementStreak(): void {
    this.streak++;
    if (this.streak > this.maxStreak) {
      this.maxStreak = this.streak;
    }
  }

  resetStreak(): void {
    this.streak = 0;
  }

  getScore(): number {
    return this.score;
  }

  getHighScore(): number {
    return this.highScore;
  }

  getStreak(): number {
    return this.streak;
  }

  saveHighScore(gameSlug: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${gameSlug}-highscore`, this.highScore.toString());
    }
  }

  reset(): void {
    this.score = 0;
    this.streak = 0;
  }
}

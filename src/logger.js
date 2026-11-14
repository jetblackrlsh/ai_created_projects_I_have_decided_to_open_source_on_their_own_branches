/**
 * Adventure Event Logger: records gameplay events grouped by in-world Day & Time.
 */
export class AdventureLogger {
  constructor(seed) {
    this.seed = seed;
    this.entries = [];
  }

  reset(seed) {
    this.seed = seed;
    this.entries = [];
  }

  log(day, timeLabel, message) {
    this.entries.push({
      day,
      timeLabel,
      message,
    });
  }

  exportText(stats) {
    const lines = [
      '====================================================',
      '        IRONBOUND WILDS — ADVENTURE EVENT LOG       ',
      '====================================================',
      `World Seed: ${this.seed}`,
      `Days Survived: ${stats.day} | Monsters Slain: ${stats.slain} | Materials Mined: ${stats.mined} | Gear Forged: ${stats.crafted}`,
      '',
    ];

    let currentDay = null;
    for (const e of this.entries) {
      if (e.day !== currentDay) {
        currentDay = e.day;
        lines.push(`--- DAY ${currentDay} ---`);
      }
      lines.push(`  [${e.timeLabel}] ${e.message}`);
    }

    lines.push('');
    lines.push('====================================================');
    return lines.join('\n');
  }

  download(stats) {
    const text = this.exportText(stats);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironbound-wilds-seed-${this.seed}-log.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

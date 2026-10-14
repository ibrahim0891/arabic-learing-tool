import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { DashboardStats, StudySessionLog } from '@/lib/types';

export async function GET() {
  try {
    const totalWordsRow = db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };
    const totalLearnedRow = db.prepare("SELECT COUNT(*) as count FROM words WHERE memoryStatus != 'new'").get() as { count: number };
    const currentlyStudyingRow = db.prepare("SELECT COUNT(*) as count FROM words WHERE memoryStatus = 'learning'").get() as { count: number };
    const strugglingRow = db.prepare("SELECT COUNT(*) as count FROM words WHERE memoryStatus = 'struggling'").get() as { count: number };
    const masteredRow = db.prepare("SELECT COUNT(*) as count FROM words WHERE memoryStatus = 'mastered'").get() as { count: number };

    // Ready for revision: nextReviewDate <= current time
    const nowIso = new Date().toISOString();
    const readyForRevisionRow = db.prepare(
      "SELECT COUNT(*) as count FROM words WHERE nextReviewDate <= ? AND memoryStatus != 'new'"
    ).get(nowIso) as { count: number };

    // Today studied count
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = db.prepare(
      "SELECT SUM(cardsStudied) as totalCards FROM study_sessions WHERE date LIKE ?"
    ).get(`${todayStr}%`) as { totalCards: number | null };

    // Overall accuracy calculation from test history
    const accuracyRow = db.prepare(
      "SELECT SUM(isCorrect) as corrects, COUNT(*) as total FROM test_history"
    ).get() as { corrects: number | null; total: number };

    const accuracyRate = accuracyRow && accuracyRow.total > 0
      ? Math.round(((accuracyRow.corrects || 0) / accuracyRow.total) * 100)
      : 85;

    // Recent study sessions
    const recentSessions = db.prepare(
      "SELECT * FROM study_sessions ORDER BY date DESC LIMIT 6"
    ).all() as StudySessionLog[];

    const stats: DashboardStats = {
      totalWords: totalWordsRow.count,
      totalLearned: totalLearnedRow.count,
      currentlyStudying: currentlyStudyingRow.count,
      struggling: strugglingRow.count,
      mastered: masteredRow.count,
      readyForRevision: readyForRevisionRow.count,
      todayStudiedCount: todaySessions.totalCards || 0,
      dailyGoal: 20, // default target cards per day
      recentSessions,
      accuracyRate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

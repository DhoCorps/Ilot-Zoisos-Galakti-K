import { NextResponse } from 'next/server';
import { ProjectModel, TeamModel } from '@ilot/infrastructure';

export async function GET() {
  try {
    const [projectStats, teamStats] = await Promise.all([
      ProjectModel.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: null, avgStress: { $avg: "$wellbeing.globalStressLevel" } } }
      ]),
      TeamModel.countDocuments({ "collectiveHealth.isOverloaded": true })
    ]);

    const globalStress = projectStats[0]?.avgStress || 0;
    
    // Détermination de la météo galactique
    let weather = 'Calme';
    if (globalStress > 40) weather = 'Nuageux';
    if (globalStress > 70) weather = 'Tempête';

    return NextResponse.json({
      weather,
      temp: Math.round(globalStress),
      overloadedNests: teamStats,
      trend: globalStress > 50 ? 'up' : 'down'
    });
  } catch (error) {
    return NextResponse.json({ error: "Nexus perturbé" }, { status: 500 });
  }
}
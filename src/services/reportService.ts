import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AiSummaryResult, Incident, OverviewStats } from '@/types/incident'
import { typeLabel } from './mapService'

export function generatePdfReport(options: {
  incidents: Incident[]
  stats: OverviewStats
  summary: AiSummaryResult | null
}): void {
  const { incidents, stats, summary } = options
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 16
  let y = margin

  doc.setFillColor(18, 18, 18)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 140, 66)
  doc.setFontSize(18)
  doc.text('CrisisHub Situation Report', margin, 14)
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  doc.text(`Generated ${new Date().toLocaleString()} — informational only`, margin, 22)

  y = 38
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  doc.text('Overview', margin, y)
  y += 6
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  const overviewLines = [
    `Active / monitored incidents: ${stats.activeIncidents}`,
    `Wildfires: ${stats.wildfires}  ·  Earthquakes: ${stats.earthquakes}  ·  Floods: ${stats.floodWarnings}`,
    `Air quality alerts: ${stats.airQualityAlerts}  ·  Volcano alerts: ${stats.volcanoAlerts}`,
    `Weather-related alerts: ${stats.weatherAlerts}  ·  Updates (24h): ${stats.recentUpdates}`,
  ]
  for (const line of overviewLines) {
    doc.text(line, margin, y)
    y += 5
  }

  y += 4
  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text('AI Situation Summary', margin, y)
  y += 6
  doc.setFontSize(9)
  doc.setTextColor(51, 65, 85)

  const summaryText =
    summary?.summary ??
    'No AI summary generated for this export. Generate a summary in the application first.'
  const split = doc.splitTextToSize(summaryText, 180)
  doc.text(split, margin, y)
  y += split.length * 4.2 + 4

  if (summary?.sections?.length) {
    for (const section of summary.sections) {
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(`${section.title} (${section.count})`, margin, y)
      y += 4
      doc.setTextColor(51, 65, 85)
      const body = doc.splitTextToSize(section.text, 180)
      doc.text(body, margin, y)
      y += body.length * 4.2 + 3
      if (y > 260) break
    }
  }

  if (summary?.uncertaintyNote) {
    doc.setTextColor(100, 116, 139)
    const note = doc.splitTextToSize(`Uncertainty: ${summary.uncertaintyNote}`, 180)
    doc.text(note, margin, y)
    y += note.length * 4.2 + 6
  }

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  doc.text('Current Incidents', margin, y)
  y += 2

  autoTable(doc, {
    startY: y + 2,
    head: [['ID', 'Type', 'Location', 'Severity', 'Status', 'Time']],
    body: incidents.slice(0, 40).map((i) => [
      i.id,
      typeLabel(i.type),
      `${i.city ? `${i.city}, ` : ''}${i.country}`,
      i.severity,
      i.status,
      new Date(i.timestamp).toLocaleString(),
    ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 140, 66] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin },
  })

  const finalY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(
    'CrisisHub does not coordinate emergency operations, provide evacuation instructions, or replace emergency services.',
    margin,
    Math.min(finalY, 285),
  )

  doc.save(`CrisisHub-Report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

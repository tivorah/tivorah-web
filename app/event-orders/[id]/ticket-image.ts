type TicketImage = {
  title: string; date: string; location: string; admission: string;
  position: number; count: number; code: string; orderId: number;
  qrSvg: string | null; status: string;
};

// Export only the selected pass, with the same layout and QR artwork as the page.
export async function ticketImage(ticket: TicketImage): Promise<File> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image export unavailable');
  const width = 840, padding = 48, contentWidth = width - padding * 2;
  const lines = (text: string, font: string) => {
    context.font = font;
    const result: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      if (line && context.measureText(`${line} ${word}`).width > contentWidth) { result.push(line); line = ''; }
      for (const character of (line ? ' ' : '') + word) {
        if (context.measureText(line + character).width > contentWidth) { result.push(line); line = ''; }
        line += character;
      }
    }
    if (line) result.push(line);
    return result;
  };
  const title = lines(ticket.title, 'bold 44px Arial');
  const admission = lines(ticket.admission, '28px Arial');
  const details = [ticket.date, ticket.location].flatMap(value => lines(value, '28px Arial'));
  const numbers = lines(`Ticket #${ticket.orderId}-${ticket.code}`, 'bold 30px Arial');
  const numberHeight = numbers.length * 38 + 20;
  const codes = lines(ticket.code, 'bold 36px monospace');
  const entryY = 100 + 48 + title.length * 54 + 12 + admission.length * 38 + 32;
  const footerY = entryY + 680 + numberHeight + codes.length * 44;
  canvas.width = width;
  canvas.height = footerY + 48 + details.length * 40 + 90;
  context.save(); context.beginPath(); context.roundRect(1, 1, width - 2, canvas.height - 2, 48); context.clip();
  context.fillStyle = '#fff'; context.fillRect(0, 0, width, canvas.height);
  context.fillStyle = '#f5f0fa'; context.fillRect(0, 0, width, 100);
  context.font = 'bold 24px Arial'; context.fillStyle = '#634096';
  context.fillText('TIVORAH EVENT PASS', padding, 60);
  context.textAlign = 'right'; context.font = '26px Arial'; context.fillStyle = '#655c70';
  context.fillText(`${ticket.position} / ${ticket.count}`, width - padding, 60);
  context.textAlign = 'left'; context.fillStyle = '#211a29'; context.font = 'bold 44px Arial';
  let y = 158;
  for (const line of title) { context.fillText(line, padding, y); y += 54; }
  y += 12; context.font = '28px Arial'; context.fillStyle = '#655c70';
  for (const line of admission) { context.fillText(line, padding, y); y += 38; }
  const divider = (at: number) => { context.beginPath(); context.setLineDash([6, 5]); context.strokeStyle = '#dcd2e6'; context.moveTo(0, at); context.lineTo(width, at); context.stroke(); context.setLineDash([]); };
  divider(entryY);
  context.textAlign = 'center'; context.font = 'bold 26px Arial'; context.fillStyle = '#563580';
  context.fillText(ticket.qrSvg ? 'Ready for entry' : ticket.status === 'Checked in' ? 'Checked in' : 'Not valid for entry', width / 2, entryY + 52);
  if (ticket.qrSvg) {
    // Inline the approved mark so an SVG loaded as an image has no external resources.
    const response = await fetch('/tivorah-mark.png');
    if (!response.ok) throw new Error('Ticket artwork unavailable');
    const logo = await response.blob();
    const logoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Artwork unavailable')); reader.readAsDataURL(logo);
    });
    const svg = ticket.qrSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('href="/tivorah-mark.png"', `href="${logoUrl}"`);
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    context.drawImage(image, (width - 480) / 2, entryY + 76, 480, 480);
  }
  context.font = '28px Arial'; context.fillStyle = '#655c70';
  context.fillText(ticket.qrSvg ? 'Show this code at the entrance' : 'This ticket cannot be used for entry.', width / 2, entryY + 586);
  context.font = 'bold 30px Arial'; context.fillStyle = '#302536';
  y = entryY + 636;
  for (const line of numbers) { context.fillText(line, width / 2, y); y += 38; }
  context.fillStyle = '#655c70'; context.font = '26px Arial'; context.fillText('Entry code', width / 2, entryY + 634 + numberHeight);
  context.font = 'bold 36px monospace'; context.fillStyle = '#302536';
  y = entryY + 684 + numberHeight;
  for (const line of codes) { context.fillText(line, width / 2, y); y += 44; }
  context.fillStyle = '#fcfafc'; context.fillRect(0, footerY, width, canvas.height - footerY);
  divider(footerY);
  context.textAlign = 'left'; context.font = '28px Arial'; context.fillStyle = '#211a29';
  y = footerY + 52;
  for (const line of details) { context.fillText(line, padding, y); y += 40; }
  context.font = '24px Arial'; context.fillStyle = '#655c70';
  context.fillText(`Booking reference #${ticket.orderId} · ${ticket.position} of ${ticket.count}`, padding, y + 18);
  context.restore(); context.beginPath(); context.roundRect(1, 1, width - 2, canvas.height - 2, 48); context.lineWidth = 2; context.strokeStyle = '#dcd2e6'; context.stroke();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed')), 'image/png'));
  return new File([blob], `Tivorah-ticket-${ticket.orderId}-${ticket.code}.png`, { type: 'image/png' });
}

export const whatsappService = {
  generateLink: (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  },
  sendAttendanceNotification: (studentName: string, status: string, date: string, phone: string) => {
    const message = `Hello, this is to inform you that ${studentName} was ${status} for the session on ${date}.`;
    const link = whatsappService.generateLink(phone, message);
    window.open(link, '_blank');
  }
};

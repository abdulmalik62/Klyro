import { toast } from 'sonner';

/**
 * Consistent toast copy for CRUD and auth across the app.
 */
export const appToasts = {
  created: (entity: string) =>
    toast.success(`${entity} created successfully`),
  updated: (entity: string) =>
    toast.success(`${entity} updated successfully`),
  deleted: (entity: string) =>
    toast.success(`${entity} deleted successfully`),
  saveFailed: (entity = 'record') =>
    toast.error(`Could not save ${entity}. Please try again.`),
  deleteFailed: (entity = 'item') =>
    toast.error(`Could not delete ${entity}. Please try again.`),
  signedIn: () => toast.success('Signed in successfully'),
  signInFailed: () =>
    toast.error('Sign-in failed. Please try again.'),
  /** Form validation / soft issues */
  fixForm: () =>
    toast.warning('Please fix the highlighted fields before continuing.'),
  confirmRequired: (context = 'enrollment') =>
    toast.warning(`Please confirm the ${context} checkbox to continue.`),
  selectClassAndSubject: () =>
    toast.warning('Select a class and a subject before saving attendance.'),
  noStudentsInClass: () =>
    toast.warning('No students in this class. Add students or pick another class.'),
  attendanceSaved: () =>
    toast.success('Attendance saved successfully'),
  attendanceFailed: () =>
    toast.error('Could not save attendance. Please try again.'),
  genericError: () =>
    toast.error('Something went wrong. Please try again.'),
  signedOut: () => toast.success('Signed out successfully'),
  whatsappNoPhone: () =>
    toast.warning('No phone number on file for this student.'),
  whatsappOpening: () => toast.info('Opening WhatsApp…'),
};

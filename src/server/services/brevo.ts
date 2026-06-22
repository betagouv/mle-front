import { env } from '~/server/env'

const brevoHeaders = {
  'api-key': env.BREVO_API_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

// --- Brevo Emails ---

interface TemplateEmailParams {
  to: string
  templateId: number
  params?: Record<string, string>
}

export async function sendTemplateEmail({ to, templateId, params }: TemplateEmailParams): Promise<void> {
  const response = await fetch(env.BREVO_API_URL, {
    method: 'POST',
    headers: brevoHeaders,
    body: JSON.stringify({
      to: [{ email: to }],
      templateId,
      replyTo: { email: 'no-reply@monlogementetudiant.beta.gouv.fr' },
      ...(params && { params }),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Brevo email failed: ${response.status} ${error}`)
  }
}

export async function sendVerificationEmail(email: string, url: string): Promise<void> {
  await sendTemplateEmail({
    to: email,
    templateId: env.BREVO_TEMPLATE_VALIDATION,
    params: { VALIDATION_LINK: url },
  })
}

export async function sendResetPasswordEmail(email: string, url: string): Promise<void> {
  await sendTemplateEmail({
    to: email,
    templateId: env.BREVO_TEMPLATE_RESET_PASSWORD,
    params: { RESET_LINK: url },
  })
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  await sendTemplateEmail({
    to: email,
    templateId: env.BREVO_TEMPLATE_MAGIC_LINK,
    params: { MAGIC_LINK: url },
  })
}

export async function sendOwnerAccountActivated(email: string, url: string): Promise<void> {
  await sendTemplateEmail({
    to: email,
    templateId: env.BREVO_TEMPLATE_MAGIC_LINK,
    params: { MAGIC_LINK: url },
  })
}

export async function sendOwnerWelcomeEmail(
  email: string,
  { firstname, lastname }: { firstname: string; lastname: string },
): Promise<void> {
  await sendTemplateEmail({
    to: email,
    templateId: env.BREVO_TEMPLATE_OWNER_WELCOME,
  })
  await syncBrevoOwnerCreated(email, { firstname, lastname })
}

export async function sendAdminResetPasswordEmail(email: string): Promise<void> {
  await sendTemplateEmail({
    to: email,
    templateId: env.BREVO_TEMPLATE_ADMIN_RESET_PASSWORD,
  })
}

// --- Brevo Contacts ---
type BrevoEspaceGestionnaire = {
  COMPTE_ESPACE_GESTIONNAIRE: boolean
  // Date 'YYYY-MM-DD' pour les gestionnaires, chaîne vide pour vider l'attribut (étudiants)
  DATE_CREATION_COMPTE_ESPACE_GESTIONNAIRE: string
  NOM: string
  PRENOM: string
}
type BrevoDataUpdated = {
  DATE_DERNIERE_MAJ_DONNEES: string
}

async function updateBrevoContactAttributes(email: string, attributes: BrevoDataUpdated | BrevoEspaceGestionnaire): Promise<void> {
  const response = await fetch(env.BREVO_CONTACTS_API_URL, {
    method: 'POST',
    headers: brevoHeaders,
    body: JSON.stringify({
      email,
      attributes,
      updateEnabled: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Échec de la mise à jour du contact Brevo : ${response.status} ${error}`)
  }
}

export async function syncBrevoOwnerCreated(
  email: string,
  // createdAt par défaut à aujourd'hui (flux live de création) ; surchargé lors du rattrapage de la base
  { firstname, lastname, createdAt }: { firstname: string; lastname: string; createdAt?: Date },
): Promise<void> {
  await updateBrevoContactAttributes(email, {
    COMPTE_ESPACE_GESTIONNAIRE: true,
    DATE_CREATION_COMPTE_ESPACE_GESTIONNAIRE: (createdAt ?? new Date()).toISOString().split('T')[0],
    NOM: lastname,
    PRENOM: firstname,
  })
}

export async function syncBrevoStudentCreated(
  email: string,
  { firstname, lastname }: { firstname: string; lastname: string },
): Promise<void> {
  await updateBrevoContactAttributes(email, {
    COMPTE_ESPACE_GESTIONNAIRE: false,
    DATE_CREATION_COMPTE_ESPACE_GESTIONNAIRE: '',
    NOM: lastname,
    PRENOM: firstname,
  })
}

export async function syncBrevoDataUpdated(email: string): Promise<void> {
  await updateBrevoContactAttributes(email, {
    DATE_DERNIERE_MAJ_DONNEES: new Date().toISOString().split('T')[0],
  })
}

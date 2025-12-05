// Système de notifications pour Padel Master

export interface NotificationTemplate {
  id: string;
  type: 'defi' | 'classement' | 'ligue' | 'securite' | 'badge';
  titre: Record<string, string>;
  message: Record<string, string>;
  action_url?: string;
  icone: string;
}

export interface NotificationData {
  destinataire_id: string;
  template_id: string;
  variables: Record<string, any>;
  langue: string;
  canaux: ('push' | 'email' | 'in_app')[];
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  date_expiration?: string;
}

// Templates de notifications multilingues
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'nouveau_defi',
    type: 'defi',
    titre: {
      fr: 'Nouveau défi reçu !',
      es: '¡Nuevo desafío recibido!',
      en: 'New challenge received!',
      it: 'Nuova sfida ricevuta!'
    },
    message: {
      fr: '{{expediteur}} vous défie pour un match. Acceptez-vous ?',
      es: '{{expediteur}} te desafía a un partido. ¿Aceptas?',
      en: '{{expediteur}} challenges you to a match. Do you accept?',
      it: '{{expediteur}} ti sfida a una partita. Accetti?'
    },
    icone: 'bell'
  },
  {
    id: 'promotion_division',
    type: 'classement',
    titre: {
      fr: 'Promotion de division ! 🎉',
      es: '¡Promoción de división! 🎉',
      en: 'Division promotion! 🎉',
      it: 'Promozione di divisione! 🎉'
    },
    message: {
      fr: 'Félicitations ! Vous êtes maintenant {{nouvelle_division}} avec {{points}} points !',
      es: '¡Felicidades! ¡Ahora eres {{nouvelle_division}} con {{points}} puntos!',
      en: 'Congratulations! You are now {{nouvelle_division}} with {{points}} points!',
      it: 'Congratulazioni! Ora sei {{nouvelle_division}} con {{points}} punti!'
    },
    icone: 'trophy'
  },
  {
    id: 'retrogradation_division',
    type: 'classement',
    titre: {
      fr: 'Changement de division',
      es: 'Cambio de división',
      en: 'Division change',
      it: 'Cambio di divisione'
    },
    message: {
      fr: 'Vous êtes maintenant {{nouvelle_division}}. Continuez vos efforts !',
      es: 'Ahora eres {{nouvelle_division}}. ¡Sigue esforzándote!',
      en: 'You are now {{nouvelle_division}}. Keep up the effort!',
      it: 'Ora sei {{nouvelle_division}}. Continua i tuoi sforzi!'
    },
    icone: 'trending-down'
  },
  {
    id: 'validation_score_requise',
    type: 'securite',
    titre: {
      fr: 'Validation de score requise',
      es: 'Validación de puntuación requerida',
      en: 'Score validation required',
      it: 'Validazione punteggio richiesta'
    },
    message: {
      fr: 'Veuillez valider le score de votre match du {{date}}. Délai: {{heures_restantes}}h',
      es: 'Por favor valida la puntuación de tu partido del {{date}}. Plazo: {{heures_restantes}}h',
      en: 'Please validate your match score from {{date}}. Deadline: {{heures_restantes}}h',
      it: 'Convalida il punteggio della partita del {{date}}. Scadenza: {{heures_restantes}}h'
    },
    icone: 'alert-triangle'
  },
  {
    id: 'nouveau_badge',
    type: 'badge',
    titre: {
      fr: 'Nouveau badge débloqué ! 🏆',
      es: '¡Nueva insignia desbloqueada! 🏆',
      en: 'New badge unlocked! 🏆',
      it: 'Nuovo badge sbloccato! 🏆'
    },
    message: {
      fr: 'Vous avez obtenu le badge "{{nom_badge}}" !',
      es: '¡Has obtenido la insignia "{{nom_badge}}"!',
      en: 'You earned the "{{nom_badge}}" badge!',
      it: 'Hai ottenuto il badge "{{nom_badge}}"!'
    },
    icone: 'star'
  }
];

/**
 * Remplace les variables dans un template de notification
 */
function remplacerVariables(template: string, variables: Record<string, any>): string {
  let message = template;
  Object.entries(variables).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return message;
}

/**
 * Prépare une notification à partir d'un template
 */
export function preparerNotification(
  template_id: string,
  variables: Record<string, any>,
  langue: string = 'fr'
): { titre: string; message: string; icone: string } | null {
  const template = NOTIFICATION_TEMPLATES.find(t => t.id === template_id);
  if (!template) return null;
  
  const lang = langue in template.titre ? langue : 'fr';
  
  return {
    titre: remplacerVariables(template.titre[lang], variables),
    message: remplacerVariables(template.message[lang], variables),
    icone: template.icone
  };
}

/**
 * Envoie une notification push (simulation)
 */
export async function envoyerNotificationPush(
  token_device: string,
  titre: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // Ici vous intégreriez Firebase Cloud Messaging ou OneSignal
    console.log('Push notification envoyée:', { token_device, titre, message, data });
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    console.error('Erreur envoi push:', error);
    return false;
  }
}

/**
 * Envoie une notification email (simulation)
 */
export async function envoyerNotificationEmail(
  email: string,
  titre: string,
  message: string,
  html?: string
): Promise<boolean> {
  try {
    // Ici vous intégreriez SendGrid, Mailgun ou autre service
    console.log('Email envoyé:', { email, titre, message });
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 200));
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}

/**
 * Traite l'envoi d'une notification complète
 */
export async function traiterNotification(data: NotificationData): Promise<{
  succes: boolean;
  resultats: Record<string, boolean>;
  erreurs: string[];
}> {
  const notification = preparerNotification(data.template_id, data.variables, data.langue);
  if (!notification) {
    return {
      succes: false,
      resultats: {},
      erreurs: ['Template de notification introuvable']
    };
  }
  
  const resultats: Record<string, boolean> = {};
  const erreurs: string[] = [];
  
  // Envoi selon les canaux demandés
  for (const canal of data.canaux) {
    try {
      switch (canal) {
        case 'push':
          // Récupérer le token device du joueur depuis la base
          const token = 'device_token_placeholder'; // À remplacer par vraie récupération
          resultats.push = await envoyerNotificationPush(
            token,
            notification.titre,
            notification.message,
            data.variables
          );
          break;
          
        case 'email':
          // Récupérer l'email du joueur depuis la base
          const email = 'user@example.com'; // À remplacer par vraie récupération
          resultats.email = await envoyerNotificationEmail(
            email,
            notification.titre,
            notification.message
          );
          break;
          
        case 'in_app':
          // Stocker en base pour affichage dans l'app
          resultats.in_app = true; // Simulation stockage réussi
          break;
      }
    } catch (error) {
      erreurs.push(`Erreur canal ${canal}: ${error}`);
      resultats[canal] = false;
    }
  }
  
  return {
    succes: Object.values(resultats).some(Boolean),
    resultats,
    erreurs
  };
}

/**
 * Badges système avec conditions de déblocage
 */
export const BADGES_SYSTEM = [
  {
    id: 'premiere_victoire',
    nom: { fr: 'Première Victoire', es: 'Primera Victoria', en: 'First Victory', it: 'Prima Vittoria' },
    description: { fr: 'Remporter son premier match', es: 'Ganar tu primer partido', en: 'Win your first match', it: 'Vinci la tua prima partita' },
    icone: 'medal',
    condition: (stats: any) => stats.victoires >= 1
  },
  {
    id: 'serie_5_victoires',
    nom: { fr: 'Série de 5', es: 'Racha de 5', en: '5-Win Streak', it: 'Serie di 5' },
    description: { fr: '5 victoires consécutives', es: '5 victorias consecutivas', en: '5 consecutive wins', it: '5 vittorie consecutive' },
    icone: 'fire',
    condition: (stats: any) => stats.serie_victoires_actuelle >= 5
  },
  {
    id: 'marathon_player',
    nom: { fr: 'Marathonien', es: 'Maratonista', en: 'Marathon Player', it: 'Maratoneta' },
    description: { fr: '50 matchs joués', es: '50 partidos jugados', en: '50 matches played', it: '50 partite giocate' },
    icone: 'target',
    condition: (stats: any) => stats.matchs_total >= 50
  },
  {
    id: 'globe_trotter',
    nom: { fr: 'Globe Trotter', es: 'Trotamundos', en: 'Globe Trotter', it: 'Giramondo' },
    description: { fr: 'Jouer dans 10 clubs différents', es: 'Jugar en 10 clubes diferentes', en: 'Play in 10 different clubs', it: 'Giocare in 10 club diversi' },
    icone: 'globe',
    condition: (stats: any) => stats.clubs_visites >= 10
  }
];
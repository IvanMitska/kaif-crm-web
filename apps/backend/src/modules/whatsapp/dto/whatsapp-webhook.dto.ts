// WhatsApp Cloud API Webhook Types
// Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string; // WhatsApp Business Account ID
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: 'messages';
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp';
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppMessageStatus[];
  errors?: WhatsAppError[];
}

export interface WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string; // WhatsApp ID (phone number without +)
}

export interface WhatsAppMessage {
  from: string; // Sender's WhatsApp ID
  id: string; // Message ID
  timestamp: string; // Unix timestamp
  type: WhatsAppMessageType;
  text?: WhatsAppTextMessage;
  image?: WhatsAppMediaMessage;
  audio?: WhatsAppMediaMessage;
  video?: WhatsAppMediaMessage;
  document?: WhatsAppDocumentMessage;
  location?: WhatsAppLocationMessage;
  contacts?: WhatsAppContactMessage[];
  interactive?: WhatsAppInteractiveMessage;
  button?: WhatsAppButtonMessage;
  sticker?: WhatsAppMediaMessage;
  reaction?: WhatsAppReactionMessage;
  context?: WhatsAppMessageContext;
  referral?: WhatsAppReferral;
}

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'button'
  | 'sticker'
  | 'reaction'
  | 'unknown';

export interface WhatsAppTextMessage {
  body: string;
}

export interface WhatsAppMediaMessage {
  id: string; // Media ID
  mime_type?: string;
  sha256?: string;
  caption?: string;
}

export interface WhatsAppDocumentMessage extends WhatsAppMediaMessage {
  filename?: string;
}

export interface WhatsAppLocationMessage {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface WhatsAppContactMessage {
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
  };
  phones?: Array<{
    phone: string;
    type?: string;
    wa_id?: string;
  }>;
  emails?: Array<{
    email: string;
    type?: string;
  }>;
}

export interface WhatsAppInteractiveMessage {
  type: 'button_reply' | 'list_reply';
  button_reply?: {
    id: string;
    title: string;
  };
  list_reply?: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface WhatsAppButtonMessage {
  text: string;
  payload: string;
}

export interface WhatsAppReactionMessage {
  message_id: string;
  emoji: string;
}

export interface WhatsAppMessageContext {
  from: string;
  id: string;
}

export interface WhatsAppReferral {
  source_url: string;
  source_type: 'ad' | 'post';
  source_id: string;
  headline?: string;
  body?: string;
  media_type?: 'image' | 'video';
}

export interface WhatsAppMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin: {
      type: 'business_initiated' | 'user_initiated' | 'referral_conversion';
    };
    expiration_timestamp?: string;
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: WhatsAppError[];
}

export interface WhatsAppError {
  code: number;
  title: string;
  message?: string;
  error_data?: {
    details: string;
  };
}

// Response types for sending messages
export interface WhatsAppSendMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

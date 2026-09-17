export type WebUrlButton = {
  type: "web_url";
  url: string;
  title: string;
  messenger_extensions?: boolean;
  webview_height_ratio?: "compact" | "tall" | "full";
};

export type PostbackButton = {
  type: "postback";
  title: string;
  payload: string;
};

export type MessengerButton = WebUrlButton | PostbackButton;

export type ButtonTemplate = {
  template_type: "button";
  text: string;
  buttons: MessengerButton[];
};

export type TextMessage = {
  text: string;
};

export type TemplateAttachment = {
  type: "template";
  payload: ButtonTemplate;
};

export type AttachmentMessage = {
  attachment: TemplateAttachment;
};

export type MessengerMessage = TextMessage | AttachmentMessage;

export type SendApiResponse = {
  recipient_id?: string;
  message_id?: string;
};

export type SendApiErrorResponse = {
  error: {
    message: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export type WebhookMessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: unknown[];
  };
  postback?: {
    title: string;
    payload: string;
  };
};

export type WebhookEntry = {
  id: string;
  time: number;
  messaging: WebhookMessagingEvent[];
};

export type WebhookPayload = {
  object: string;
  entry: WebhookEntry[];
};

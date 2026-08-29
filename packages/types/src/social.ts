import type { ConversationParticipantType, MediaKind, NotificationType } from "./enums";

export interface Favorite {
  id: string;
  weddingId: string;
  vendorId: string | null;
  mediaId: string | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  weddingId: string;
  name: string;
  createdAt: string;
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  mediaId: string;
  createdAt: string;
}

export interface Media {
  id: string;
  kind: MediaKind;
  storagePath: string;
  uploadedByUserId: string;
  vendorId: string | null;
  weddingId: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  weddingId: string;
  vendorId: string;
  createdAt: string;
}

export interface ConversationMember {
  conversationId: string;
  userId: string;
  participantType: ConversationParticipantType;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  attachmentMediaId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  authorUserId: string | null;
  authorVendorId: string | null;
  weddingId: string | null;
  text: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorUserId: string;
  text: string;
  createdAt: string;
}

export interface Like {
  postId: string;
  userId: string;
  createdAt: string;
}

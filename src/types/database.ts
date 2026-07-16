export type UserRole = "admin" | "membro";
export type TimeSlot = "mattina" | "pomeriggio" | "sera";
export type AvailabilityStatus = "disponibile" | "non_disponibile" | "forse";
export type EventType = "prova" | "concerto";
export type SongStatus = "proposto" | "in_prova" | "pronto_live" | "scartato";
export type TaskStatus = "da_fare" | "in_corso" | "fatto";
export type BookingStatus = "contattato" | "in_negoziazione" | "confermato" | "annullato" | "pagato";
export type EventStatus = "da_confermare" | "confermato" | "annullato" | "concluso";
export type TransactionType = "entrata" | "uscita";
export type TransactionCategory =
  | "cachet"
  | "attrezzatura"
  | "trasporto"
  | "sala_prove"
  | "promozione"
  | "commissione_booking"
  | "altro";
export type MediaType = "audio" | "video" | "immagine" | "documento";
export type EquipmentCategory = "chitarra" | "basso" | "batteria" | "ampli" | "microfoni" | "cavi" | "altro";
export type OwnerType = "membro" | "band";

// Nota: usare `type` e non `interface` per Row/Insert/Update — le interface non ottengono
// l'index signature implicita richiesta da @supabase/supabase-js (Record<string, unknown>),
// e le query risultano tipizzate `never`.

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  hidden: boolean;
  suspended: boolean;
  created_at: string;
};

export type Availability = {
  id: string;
  user_id: string;
  date: string;
  time_slot: TimeSlot;
  status: AvailabilityStatus;
  note: string | null;
  created_at: string;
};

export type Event = {
  id: string;
  type: EventType;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  setlist_id: string | null;
  status: EventStatus;
  venue_id: string | null;
  venue_contact_name: string | null;
  venue_contact_phone: string | null;
  venue_contact_email: string | null;
  load_in_time: string | null;
  soundcheck_time: string | null;
  fee_amount: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  technical_rider_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string | null;
  proposed_by: string | null;
  updated_by: string | null;
  reference_links: string[];
  key: string | null;
  bpm: number | null;
  duration_seconds: number;
  status: SongStatus;
  notes: string | null;
  is_original: boolean;
  created_at: string;
  updated_at: string;
};

export type Vote = {
  id: string;
  song_id: string;
  user_id: string;
  score: number;
  created_at: string;
};

export type Setlist = {
  id: string;
  event_id: string | null;
  title: string;
  target_duration_minutes: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SetlistItem = {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: TaskStatus;
  related_event_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Venue = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  capacity: number | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingLead = {
  id: string;
  venue_id: string;
  event_id: string | null;
  status: BookingStatus;
  proposed_date: string | null;
  fee_proposed: number | null;
  fee_agreed: number | null;
  deposit_amount: number | null;
  deposit_paid: boolean;
  contract_url: string | null;
  follow_up_date: string | null;
  owner: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  category: TransactionCategory;
  related_event_id: string | null;
  date: string;
  paid_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EventChecklistTemplate = {
  id: string;
  event_type: EventType;
  title: string;
  position: number;
};

export type NotificationPreference = {
  user_id: string;
  email_enabled: boolean;
  notify_new_song: boolean;
  notify_availability_reminder: boolean;
  notify_task_assigned: boolean;
  notify_booking_update: boolean;
  notify_payment_due: boolean;
};

export type ActivityAction = "created" | "updated" | "deleted" | "status_changed" | "voted" | "invited" | "restored";
export type ActivityEntityType =
  | "song"
  | "event"
  | "task"
  | "setlist"
  | "venue"
  | "booking_lead"
  | "transaction"
  | "member"
  | "profile"
  | "availability"
  | "comment"
  | "media_item"
  | "equipment"
  | "original_work"
  | "stage_plot_item"
  | "tech_rider_channel";

export type CommentParentType = "song" | "event" | "task" | "booking_lead";

export type ActivityLog = {
  id: string;
  user_id: string | null;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_label: string | null;
  detail: string | null;
  snapshot: Record<string, unknown> | null;
  restored_at: string | null;
  restored_by: string | null;
  created_at: string;
};

export type PressKit = {
  id: string;
  band_name: string | null;
  bio_short: string | null;
  bio_long: string | null;
  photo_urls: string[];
  audio_links: string[];
  video_links: string[];
  contact_email: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type Comment = {
  id: string;
  parent_type: CommentParentType;
  parent_id: string;
  user_id: string | null;
  text: string;
  created_at: string;
};

export type StagePlotItem = {
  id: string;
  instrument: string;
  position: string;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TechRider = {
  id: string;
  pa_requirements: string | null;
  monitor_requirements: string | null;
  power_requirements: string | null;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type TechRiderChannel = {
  id: string;
  channel_number: number | null;
  source: string;
  mic_or_di: string | null;
  stand: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MediaItem = {
  id: string;
  type: MediaType;
  file_path: string;
  file_name: string;
  file_size: number | null;
  title: string;
  related_song_id: string | null;
  related_event_id: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type Equipment = {
  id: string;
  name: string;
  owner_type: OwnerType;
  owner_id: string | null;
  category: EquipmentCategory;
  last_maintenance_date: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OriginalWork = {
  id: string;
  song_id: string;
  siae_deposit_date: string | null;
  siae_code: string | null;
  authors_split: Record<string, number>;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      availability: {
        Row: Availability;
        Insert: Partial<Availability>;
        Update: Partial<Availability>;
        Relationships: [];
      };
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event>; Relationships: [] };
      songs: { Row: Song; Insert: Partial<Song>; Update: Partial<Song>; Relationships: [] };
      votes: { Row: Vote; Insert: Partial<Vote>; Update: Partial<Vote>; Relationships: [] };
      setlists: { Row: Setlist; Insert: Partial<Setlist>; Update: Partial<Setlist>; Relationships: [] };
      setlist_items: {
        Row: SetlistItem;
        Insert: Partial<SetlistItem>;
        Update: Partial<SetlistItem>;
        Relationships: [];
      };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task>; Relationships: [] };
      venues: { Row: Venue; Insert: Partial<Venue>; Update: Partial<Venue>; Relationships: [] };
      booking_leads: {
        Row: BookingLead;
        Insert: Partial<BookingLead>;
        Update: Partial<BookingLead>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction>;
        Update: Partial<Transaction>;
        Relationships: [];
      };
      event_checklist_templates: {
        Row: EventChecklistTemplate;
        Insert: Partial<EventChecklistTemplate>;
        Update: Partial<EventChecklistTemplate>;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreference;
        Insert: Partial<NotificationPreference> & { user_id: string };
        Update: Partial<NotificationPreference>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLog;
        Insert: Partial<ActivityLog>;
        Update: Partial<ActivityLog>;
        Relationships: [];
      };
      press_kit: { Row: PressKit; Insert: Partial<PressKit>; Update: Partial<PressKit>; Relationships: [] };
      comments: { Row: Comment; Insert: Partial<Comment>; Update: Partial<Comment>; Relationships: [] };
      media_items: { Row: MediaItem; Insert: Partial<MediaItem>; Update: Partial<MediaItem>; Relationships: [] };
      equipment: { Row: Equipment; Insert: Partial<Equipment>; Update: Partial<Equipment>; Relationships: [] };
      original_works: {
        Row: OriginalWork;
        Insert: Partial<OriginalWork>;
        Update: Partial<OriginalWork>;
        Relationships: [];
      };
      stage_plot_items: {
        Row: StagePlotItem;
        Insert: Partial<StagePlotItem>;
        Update: Partial<StagePlotItem>;
        Relationships: [];
      };
      tech_rider: { Row: TechRider; Insert: Partial<TechRider>; Update: Partial<TechRider>; Relationships: [] };
      tech_rider_channels: {
        Row: TechRiderChannel;
        Insert: Partial<TechRiderChannel>;
        Update: Partial<TechRiderChannel>;
        Relationships: [];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
  };
};

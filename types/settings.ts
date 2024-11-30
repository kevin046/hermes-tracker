export interface Setting {
  id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  interval: number
  emailTemplate: string
  enabled: boolean
} 
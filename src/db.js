import Dexie from 'dexie'

export const db = new Dexie('StudentJobSurveyDB')

db.version(1).stores({
  surveys: 'id, name, timestamp, syncStatus'
})
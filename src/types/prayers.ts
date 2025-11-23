interface PrayerText {
  text: string;
}

interface PrayerLanguage {
  malayalam: PrayerText;
  english?: PrayerText;
}

interface PrayerWithTitle {
  title: {
    malayalam: string;
  };
  malayalam: PrayerText;
}

interface PrefaceAnnouncement {
  priest_prayer1: PrayerLanguage;
  response1: PrayerLanguage;
  priest_prayer2: PrayerLanguage;
  response2: PrayerLanguage;
  priest_prayer3: PrayerLanguage;
  response3: PrayerLanguage;
  our_father_prayer: PrayerWithTitle;
  altar_response: PrayerLanguage;
  lord_our_god_prayer: PrayerLanguage;
}

interface Mass {
  "preface-announcement": PrefaceAnnouncement;
}

interface PrayersData {
  mass: Mass;
}

export type PrayersType = PrayersData;

export interface Prayer {
  id: string;
  title?: string;
  malayalamText: string;
  englishText?: string;
}

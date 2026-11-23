export type CitySeed = {
  slug: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  center?: boolean;
};

// O'zbekistonning barcha viloyat markazlari va yirik shaharlari
export const CITIES: CitySeed[] = [
  // Toshkent shahri
  { slug: "toshkent", name: "Toshkent", region: "Toshkent shahri", lat: 41.2995, lon: 69.2401, center: true },

  // Toshkent viloyati
  { slug: "nurafshon", name: "Nurafshon", region: "Toshkent viloyati", lat: 41.0167, lon: 69.3417, center: true },
  { slug: "chirchiq", name: "Chirchiq", region: "Toshkent viloyati", lat: 41.4689, lon: 69.5822 },
  { slug: "olmaliq", name: "Olmaliq", region: "Toshkent viloyati", lat: 40.8447, lon: 69.5983 },
  { slug: "angren", name: "Angren", region: "Toshkent viloyati", lat: 41.0167, lon: 70.1436 },
  { slug: "bekobod", name: "Bekobod", region: "Toshkent viloyati", lat: 40.2214, lon: 69.2697 },
  { slug: "ohangaron", name: "Ohangaron", region: "Toshkent viloyati", lat: 40.9064, lon: 69.6383 },
  { slug: "yangiyol", name: "Yangiyo'l", region: "Toshkent viloyati", lat: 41.1122, lon: 69.0472 },

  // Andijon viloyati
  { slug: "andijon", name: "Andijon", region: "Andijon viloyati", lat: 40.7821, lon: 72.3442, center: true },
  { slug: "asaka", name: "Asaka", region: "Andijon viloyati", lat: 40.6415, lon: 72.2387 },
  { slug: "xonobod", name: "Xonobod", region: "Andijon viloyati", lat: 40.8028, lon: 72.9767 },
  { slug: "shahrixon", name: "Shahrixon", region: "Andijon viloyati", lat: 40.7133, lon: 72.0569 },

  // Farg'ona viloyati
  { slug: "fargona", name: "Farg'ona", region: "Farg'ona viloyati", lat: 40.3842, lon: 71.7843, center: true },
  { slug: "qoqon", name: "Qo'qon", region: "Farg'ona viloyati", lat: 40.5286, lon: 70.9425 },
  { slug: "margilon", name: "Marg'ilon", region: "Farg'ona viloyati", lat: 40.4714, lon: 71.7247 },
  { slug: "quvasoy", name: "Quvasoy", region: "Farg'ona viloyati", lat: 40.2972, lon: 71.98 },
  { slug: "rishton", name: "Rishton", region: "Farg'ona viloyati", lat: 40.3567, lon: 71.2847 },

  // Namangan viloyati
  { slug: "namangan", name: "Namangan", region: "Namangan viloyati", lat: 40.9983, lon: 71.6726, center: true },
  { slug: "chust", name: "Chust", region: "Namangan viloyati", lat: 41.0033, lon: 71.2378 },
  { slug: "pop", name: "Pop", region: "Namangan viloyati", lat: 40.8736, lon: 71.1089 },
  { slug: "chortoq", name: "Chortoq", region: "Namangan viloyati", lat: 41.0692, lon: 71.8236 },

  // Sirdaryo viloyati
  { slug: "guliston", name: "Guliston", region: "Sirdaryo viloyati", lat: 40.4897, lon: 68.7842, center: true },
  { slug: "yangiyer", name: "Yangiyer", region: "Sirdaryo viloyati", lat: 40.275, lon: 68.8225 },
  { slug: "shirin", name: "Shirin", region: "Sirdaryo viloyati", lat: 40.2253, lon: 69.1097 },

  // Jizzax viloyati
  { slug: "jizzax", name: "Jizzax", region: "Jizzax viloyati", lat: 40.1158, lon: 67.8422, center: true },
  { slug: "gallaorol", name: "G'allaorol", region: "Jizzax viloyati", lat: 40.0247, lon: 67.5958 },
  { slug: "dostlik", name: "Do'stlik", region: "Jizzax viloyati", lat: 40.5247, lon: 68.0358 },

  // Samarqand viloyati
  { slug: "samarqand", name: "Samarqand", region: "Samarqand viloyati", lat: 39.6542, lon: 66.9597, center: true },
  { slug: "kattaqorgon", name: "Kattaqo'rg'on", region: "Samarqand viloyati", lat: 39.8989, lon: 66.2561 },
  { slug: "urgut", name: "Urgut", region: "Samarqand viloyati", lat: 39.4022, lon: 67.2431 },
  { slug: "ishtixon", name: "Ishtixon", region: "Samarqand viloyati", lat: 39.9661, lon: 66.4861 },

  // Buxoro viloyati
  { slug: "buxoro", name: "Buxoro", region: "Buxoro viloyati", lat: 39.7747, lon: 64.4286, center: true },
  { slug: "kogon", name: "Kogon", region: "Buxoro viloyati", lat: 39.7228, lon: 64.5517 },
  { slug: "gijduvon", name: "G'ijduvon", region: "Buxoro viloyati", lat: 40.1, lon: 64.6833 },
  { slug: "qorakol", name: "Qorako'l", region: "Buxoro viloyati", lat: 39.5, lon: 63.85 },

  // Navoiy viloyati
  { slug: "navoiy", name: "Navoiy", region: "Navoiy viloyati", lat: 40.0844, lon: 65.3792, center: true },
  { slug: "zarafshon", name: "Zarafshon", region: "Navoiy viloyati", lat: 41.5733, lon: 64.2014 },
  { slug: "uchquduq", name: "Uchquduq", region: "Navoiy viloyati", lat: 42.1567, lon: 63.5556 },
  { slug: "nurota", name: "Nurota", region: "Navoiy viloyati", lat: 40.5614, lon: 65.6886 },

  // Qashqadaryo viloyati
  { slug: "qarshi", name: "Qarshi", region: "Qashqadaryo viloyati", lat: 38.8606, lon: 65.7891, center: true },
  { slug: "shahrisabz", name: "Shahrisabz", region: "Qashqadaryo viloyati", lat: 39.0578, lon: 66.8342 },
  { slug: "kitob", name: "Kitob", region: "Qashqadaryo viloyati", lat: 39.12, lon: 66.88 },
  { slug: "guzor", name: "G'uzor", region: "Qashqadaryo viloyati", lat: 38.6208, lon: 66.2481 },
  { slug: "muborak", name: "Muborak", region: "Qashqadaryo viloyati", lat: 39.2556, lon: 65.1528 },

  // Surxondaryo viloyati
  { slug: "termiz", name: "Termiz", region: "Surxondaryo viloyati", lat: 37.2242, lon: 67.2783, center: true },
  { slug: "denov", name: "Denov", region: "Surxondaryo viloyati", lat: 38.2672, lon: 67.8986 },
  { slug: "sherobod", name: "Sherobod", region: "Surxondaryo viloyati", lat: 37.6672, lon: 67.0094 },
  { slug: "boysun", name: "Boysun", region: "Surxondaryo viloyati", lat: 38.205, lon: 67.2 },
  { slug: "shorchi", name: "Sho'rchi", region: "Surxondaryo viloyati", lat: 38.0, lon: 67.7833 },

  // Xorazm viloyati
  { slug: "urganch", name: "Urganch", region: "Xorazm viloyati", lat: 41.55, lon: 60.6333, center: true },
  { slug: "xiva", name: "Xiva", region: "Xorazm viloyati", lat: 41.3783, lon: 60.3639 },
  { slug: "hazorasp", name: "Hazorasp", region: "Xorazm viloyati", lat: 41.3194, lon: 61.0742 },
  { slug: "pitnak", name: "Pitnak", region: "Xorazm viloyati", lat: 41.4717, lon: 61.2083 },

  // Qoraqalpog'iston Respublikasi
  { slug: "nukus", name: "Nukus", region: "Qoraqalpog'iston Respublikasi", lat: 42.46, lon: 59.61, center: true },
  { slug: "xojayli", name: "Xo'jayli", region: "Qoraqalpog'iston Respublikasi", lat: 42.4047, lon: 59.4517 },
  { slug: "qongirot", name: "Qo'ng'irot", region: "Qoraqalpog'iston Respublikasi", lat: 43.0758, lon: 58.9 },
  { slug: "beruniy", name: "Beruniy", region: "Qoraqalpog'iston Respublikasi", lat: 41.6911, lon: 60.7525 },
  { slug: "tortkol", name: "To'rtko'l", region: "Qoraqalpog'iston Respublikasi", lat: 41.55, lon: 61.0 },
  { slug: "chimboy", name: "Chimboy", region: "Qoraqalpog'iston Respublikasi", lat: 42.9311, lon: 59.7708 },
  { slug: "moynoq", name: "Mo'ynoq", region: "Qoraqalpog'iston Respublikasi", lat: 43.7683, lon: 59.0214 },
];

export const REGIONS = Array.from(new Set(CITIES.map((c) => c.region)));

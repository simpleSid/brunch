import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve("index.html"), "utf8");
const menuPanelMatch = html.match(/<div class="([^"]*\bmenu-panel\b[^"]*)">/);

if (!menuPanelMatch) {
  console.error("Menu panel is missing.");
  process.exit(1);
}

if (menuPanelMatch[1].split(/\s+/).includes("reveal")) {
  console.error("Menu panel must not be hidden behind a reveal animation.");
  process.exit(1);
}

const requiredSections = [
  "Завтраки весь день",
  "Большой завтрак",
  "Закуски",
  "Салаты",
  "Супы",
  "Основные блюда",
  "Десерты",
  "Чайная карта",
  "Барная карта",
];

const requiredItems = [
  "Смузи боул из фруктов и ягод с гранолой",
  "Круассан или тартин на закваске: лосось / авокадо / креметте",
  "Скрембл",
  "Красная икра",
  "Брускетта с тартаром из лосося",
  "Теплый салат из кальмаров",
  "Куриный бульон с домашней лапшой",
  "Тальята из тунца",
  "ПП конфеты: горький шоколад/апельсин",
  "Имбирь-Лемонграсс",
  "Кофе-тюр / двойной",
  "Матча латте зеленая/розовая",
  "Минеральная вода &quot;Аква Русса&quot;",
  "Ягодный, 300 мл",
];

const missingSections = requiredSections.filter((section) => !html.includes(section));
const missingItems = requiredItems.filter((item) => !html.includes(item));

if (missingSections.length || missingItems.length) {
  console.error("Menu is incomplete.");
  if (missingSections.length) {
    console.error(`Missing sections: ${missingSections.join(", ")}`);
  }
  if (missingItems.length) {
    console.error(`Missing items: ${missingItems.join(", ")}`);
  }
  process.exit(1);
}

console.log("Menu completeness check passed.");

import * as fs from "fs";
import * as path from "path";

const CONFIG_PATH = path.resolve(__dirname, "../store.config.json");
const ENV_PATH = path.resolve(__dirname, "../.env");

function readJson(fp: string) {
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function readEnv(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([^#=]\w+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

async function graphql(
  apiUrl: string,
  appToken: string,
  query: string,
  variables: Record<string, unknown>
) {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-token": appToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error("GraphQL error:", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

async function main() {
  const config = readJson(CONFIG_PATH);
  const env = readEnv(ENV_PATH);

  const apiUrl = config.erxes_api_url || env.EXPO_PUBLIC_ERXES_API_URL;
  const appToken = env.EXPO_PUBLIC_ERXES_CP_TOKEN || config.erxes_app_token;
  const cmsId = config.erxes_cms_id;

  if (!apiUrl || !appToken) throw new Error("Missing API URL or token");
  if (!cmsId) throw new Error("ERXES_CMS_ID not set. Run erxes-cms.ts first.");

  const langs: string[] = config.languages || ["mn", "en"];
  const defaultLang = config.language || "mn";
  const storeName = config.name || "testapp";

  const categoriesCreated: Record<string, string> = {};
  const tagsCreated: Record<string, string> = {};
  const pagesCreated: Record<string, string> = {};

  // ── Step 1: Categories ──
  console.log("\n=== Creating Categories ===");
  const categories = [
    { name: { mn: "Гутал", en: "Sneakers" }, slug: "sneakers" },
    { name: { mn: "Хувцас", en: "Apparel" }, slug: "apparel" },
    { name: { mn: "Дагалдах хэрэгсэл", en: "Accessories" }, slug: "accessories" },
    { name: { mn: "Мэдээ", en: "News" }, slug: "news" },
  ];

  for (const cat of categories) {
    const data = await graphql(
      apiUrl,
      appToken,
      `mutation CpCmsCategoriesAdd($input: PostCategoryInput!) {
        cpCmsCategoriesAdd(input: $input) { _id name slug }
      }`,
      {
        input: {
          name: cat.name[defaultLang],
          slug: cat.slug,
        },
      }
    );
    const id = data.cpCmsCategoriesAdd._id;
    categoriesCreated[cat.slug] = id;
    console.log(`  Category "${cat.name[defaultLang]}" -> ${id}`);

    // Add translation for non-default languages
    for (const lang of langs) {
      if (lang === defaultLang) continue;
      try {
        await graphql(
          apiUrl,
          appToken,
          `mutation CpCmsAddTranslation($input: TranslationInput!) {
            cpCmsAddTranslation(input: $input) { _id }
          }`,
          {
            input: {
              objectId: id,
              language: lang,
              type: "category",
              title: cat.name[lang],
            },
          }
        );
        console.log(`    Translation added: ${cat.name[lang]} (${lang})`);
      } catch {
        console.log(`    Skipping translation for ${cat.name[lang]}`);
      }
    }
  }

  // ── Step 2: Tags ──
  console.log("\n=== Creating Tags ===");
  const tags = [
    { name: { mn: "Онцлох", en: "Featured" }, slug: "featured" },
    { name: { mn: "Заавар", en: "Guide" }, slug: "guide" },
    { name: { mn: "Зарлал", en: "Announcement" }, slug: "announcement" },
    { name: { mn: "Шинэ", en: "New" }, slug: "new" },
  ];

  for (const tag of tags) {
    const data = await graphql(
      apiUrl,
      appToken,
      `mutation CpCmsTagsAdd($input: PostTagInput!) {
        cpCmsTagsAdd(input: $input) { _id name slug }
      }`,
      {
        input: {
          name: tag.name[defaultLang],
          slug: tag.slug,
        },
      }
    );
    const id = data.cpCmsTagsAdd._id;
    tagsCreated[tag.slug] = id;
    console.log(`  Tag "${tag.name[defaultLang]}" -> ${id}`);

    for (const lang of langs) {
      if (lang === defaultLang) continue;
      try {
        await graphql(
          apiUrl,
          appToken,
          `mutation CpCmsAddTranslation($input: TranslationInput!) {
            cpCmsAddTranslation(input: $input) { _id }
          }`,
          {
            input: {
              objectId: id,
              language: lang,
              type: "tag",
              title: tag.name[lang],
            },
          }
        );
      } catch {
        /* skip */
      }
    }
  }

  // ── Step 3: Pages ──
  console.log("\n=== Creating Pages ===");
  const pagesData = generatePages(storeName, langs, defaultLang);

  for (const page of pagesData) {
    try {
      const data = await graphql(
        apiUrl,
        appToken,
        `mutation CpCmsPagesAdd($input: PageInput!) {
          cpCmsPagesAdd(input: $input) { _id name slug status }
        }`,
        {
          input: {
            name: page.title,
            slug: page.slug,
            description: page.description,
            content: page.content,
            status: "published",
            language: page.lang,
          },
        }
      );
      const id = data.cpCmsPagesAdd._id;
      const key = `${page.slug}-${page.lang}`;
      pagesCreated[key] = id;
      console.log(`  Page "${page.title}" (${page.lang}) -> ${id}`);
    } catch (err) {
      console.error(`  Failed to create page "${page.title}":`, err);
    }
  }

  // ── Step 4: Posts ──
  console.log("\n=== Creating Posts ===");
  const postsData = generatePosts(storeName, langs, defaultLang, categoriesCreated);

  for (const post of postsData) {
    try {
      const data = await graphql(
        apiUrl,
        appToken,
        `mutation CpCmsPostsAdd($input: PostInput!) {
          cpCmsPostsAdd(input: $input) { _id title slug status }
        }`,
        {
          input: {
            title: post.title,
            slug: post.slug,
            content: post.content,
            status: "published",
            publishedDate: post.publishedDate,
            categoryIds: post.categoryIds,
            tagIds: post.tagIds,
            language: post.lang,
          },
        }
      );
      console.log(`  Post "${post.title}" (${post.lang}) -> ${data.cpCmsPostsAdd._id}`);
    } catch (err) {
      console.error(`  Failed to create post "${post.title}":`, err);
    }
  }

  // ── Step 5: Menus ──
  console.log("\n=== Creating Menus ===");
  const menus = generateMenus(defaultLang);

  for (const menu of menus) {
    try {
      const data = await graphql(
        apiUrl,
        appToken,
        `mutation CpCmsAddMenu($input: MenuItemInput!) {
          cpCmsAddMenu(input: $input) { _id kind label url order }
        }`,
        {
          input: {
            kind: menu.kind,
            label: menu.label,
            url: menu.url,
            order: menu.order,
          },
        }
      );
      console.log(`  Menu "${menu.label}" (${menu.kind}) -> ${data.cpCmsAddMenu._id}`);
    } catch (err) {
      console.error(`  Failed to create menu "${menu.label}":`, err);
    }
  }

  console.log("\n=== Seeding Complete ===");
}

function generatePages(
  storeName: string,
  langs: string[],
  defaultLang: string
) {
  const pages: Array<{
    slug: string;
    lang: string;
    title: string;
    description: string;
    content: string;
  }> = [];

  const pageDefs: Record<
    string,
    Record<string, { title: string; description: string; content: string }>
  > = {
    about: {
      mn: {
        title: "Бидний тухай",
        description: `${storeName} — таны итгэлт гутал худалдаалагч`,
        content: `<h2>${storeName}-тай танилцана уу</h2><p>${storeName} нь Монголын хамгийн том гутлын онлайн дэлгүүр юм. Бид чанартай, загварлаг гутлуудыг хямд үнээр санал болгодог.</p><p>Манай баг танд хамгийн шилдэг гутлыг сонгоход туслахад бэлэн байна. Бид таны хэрэгцээнд тохирсон бүтээгдэхүүнийг санал болгодог.</p><p>2019 онд байгуулагдсан ${storeName} нь өдгөө 5000 гаруй сэтгэл ханамжтай хэрэглэгчтэй.</p>`,
      },
      en: {
        title: "About Us",
        description: `${storeName} — Your trusted sneaker retailer`,
        content: `<h2>Welcome to ${storeName}</h2><p>${storeName} is Mongolia's premier online sneaker store. We offer quality, stylish footwear at affordable prices.</p><p>Our team is ready to help you find the perfect pair. We provide products tailored to your needs.</p><p>Founded in 2019, ${storeName} now serves over 5,000 satisfied customers.</p>`,
      },
    },
    contact: {
      mn: {
        title: "Холбоо барих",
        description: "Бидэнтэй холбогдох",
        content: `<h2>Бидэнтэй холбогдох</h2><p>Утас: +976 7000-0000</p><p>И-мэйл: hello@${storeName.toLowerCase()}.mn</p><p>Хаяг: Улаанбаатар хот, Сүхбаатар дүүрэг, 1-р хороо</p><p>Ажлын цаг: Даваа - Баасан, 09:00 - 18:00</p>`,
      },
      en: {
        title: "Contact Us",
        description: "Get in touch with us",
        content: `<h2>Contact Us</h2><p>Phone: +976 7000-0000</p><p>Email: hello@${storeName.toLowerCase()}.mn</p><p>Address: Ulaanbaatar, Sukhbaatar district, 1st khoroo</p><p>Hours: Monday - Friday, 09:00 - 18:00</p>`,
      },
    },
    faq: {
      mn: {
        title: "Түгээмэл асуултууд",
        description: "Түгээмэл асуултууд ба хариултууд",
        content: `<h2>Түгээмэл асуултууд</h2><h3>Хэрхэн захиалга өгөх вэ?</h3><p>Бүтээгдэхүүнээ сонгоод, сагсанд хийж, төлбөрөө төлөөд, хүргэлтийн мэдээллээ бөглөнө үү.</p><h3>Хүргэлт хэдэн өдөр болох вэ?</h3><p>Хотын дотор 1-2 өдөр, хөдөө орон нутагт 3-5 өдөр.</p><h3>Буцаалт хүлээн авдаг уу?</h3><p>Тийм, 14 хоногийн дотор буцаалт хүлээн авна. Бүтээгдэхүүн нь анхны байдалд байх шаардлагатай.</p><h3>Төлбөрийн хэлбэрүүд?</h3><p>Бид QPay, Хаан Банк, Голомт банк зэрэг бүх төлбөрийн хэрэгслийг хүлээн авдаг.</p>`,
      },
      en: {
        title: "FAQ",
        description: "Frequently Asked Questions",
        content: `<h2>Frequently Asked Questions</h2><h3>How do I place an order?</h3><p>Select your product, add to cart, complete payment, and fill in delivery details.</p><h3>How long does delivery take?</h3><p>Within the city: 1-2 days. Rural areas: 3-5 days.</p><h3>Do you accept returns?</h3><p>Yes, returns accepted within 14 days. Product must be in original condition.</p><h3>What payment methods?</h3><p>We accept QPay, Khan Bank, Golomt Bank, and all major payment methods.</p>`,
      },
    },
  };

  for (const [slug, defs] of Object.entries(pageDefs)) {
    for (const lang of langs) {
      const def = defs[lang] || defs[defaultLang];
      if (def) {
        pages.push({
          slug,
          lang,
          title: def.title,
          description: def.description,
          content: def.content,
        });
      }
    }
  }

  return pages;
}

function generatePosts(
  storeName: string,
  langs: string[],
  defaultLang: string,
  categories: Record<string, string>
) {
  const posts: Array<{
    title: string;
    slug: string;
    description: string;
    content: string;
    publishedDate: string;
    categoryIds: string[];
    tagIds: string[];
    lang: string;
  }> = [];

  const today = new Date().toISOString().split("T")[0];

  const postDefs = [
    {
      slug: "2026-sneaker-trends",
      mn: {
        title: "2026 оны гутлын чиг хандлага",
        description: "Энэ жилийн хамгийн загварлаг гутлын чиг хандлага",
        content: `<p>2026 онд гутлын загварт томоохон өөрчлөлт гарч байна. Энэ жилийн хамгийн гол чиг хандлагуудыг танилцуулж байна.</p><p>Монгол залуучуудын дунд ретро загварын пүүз, minimalistic дизайн, мөн гараар хийсэн онцгой загварууд ихээхэн эрэлттэй байна.</p><p>Байгальд ээлтэй материалууд, тогтвортой үйлдвэрлэл нь 2026 оны хамгийн чухал чиг хандлагын нэг болж байна.</p><p>Манай дэлгүүрээс та эдгээр бүх чиг хандлагад нийцсэн шилдэг гутлуудыг олж болно.</p>`,
      },
      en: {
        title: "2026 Sneaker Trends",
        description: "The hottest sneaker trends this year",
        content: `<p>2026 brings major changes to sneaker design. Here are the key trends of the year.</p><p>Retro-style sneakers, minimalistic designs, and handcrafted special editions are in high demand among Mongolian youth.</p><p>Eco-friendly materials and sustainable production are becoming the most important trends of 2026.</p><p>Find all these trends and more at our store.</p>`,
      },
    },
    {
      slug: "shoe-care-guide",
      mn: {
        title: "Гутлаа арчлах зөвлөмж",
        description: "Гутлаа удаан хугацаанд шинэ хэвээр хадгалах",
        content: `<p>Гутлаа зөв арчлах нь тэдний насжилтыг уртасгаж, гадаад төрхийг нь хадгалдаг.</p><p>Эхний зөвлөмж: Гутлаа тогтмол цэвэрлэж байх. Шороо, тоос нь материалыг гэмтээдэг.</p><p>Хоёрдугаарт: Гутлаа чийгтэй газар хадгалахаас зайлсхий. Хатаахдаа нарны шууд тусгалаас хол байлга.</p><p>Гутлын улавчийг тогтмол сольж байх нь ариун цэврийг хадгалж, тав тухыг нэмэгдүүлнэ.</p>`,
      },
      en: {
        title: "Shoe Care Guide",
        description: "Keep your sneakers looking new longer",
        content: `<p>Proper shoe care extends their lifespan and maintains appearance.</p><p>First tip: Clean your shoes regularly. Dirt and dust can damage materials.</p><p>Second: Avoid storing shoes in damp places. Keep away from direct sunlight when drying.</p><p>Regularly replacing insoles maintains hygiene and increases comfort.</p>`,
      },
    },
    {
      slug: "new-arrivals-summer",
      mn: {
        title: "Зуны шинэ цуглуулга",
        description: "2026 оны зуны хамгийн сүүлийн цуглуулга",
        content: `<p>Зуны шинэ цуглуулга маань ирлээ! Энэ удаад бид хөнгөн, амьсгалдаг материалуудаар хийсэн гутлуудыг танилцуулж байна.</p><p>Танд зориулсан төрөл бүрийн загвар, өнгөний сонголтуудыг бэлтгэсэн. Спорт загвараас эхлээд өдөр тутам өмсөх загвар хүртэл.</p><p>Зуны хямдрал: Шинэ цуглуулгын бүтээгдэхүүнүүдэд 20% хямдрал үйлчилж байна.</p>`,
      },
      en: {
        title: "Summer Collection",
        description: "Our latest summer 2026 collection",
        content: `<p>Our summer collection has arrived! We're introducing lightweight, breathable sneakers.</p><p>A wide variety of styles and colors await you — from sporty looks to everyday wear.</p><p>Summer sale: 20% off all new collection items.</p>`,
      },
    },
  ];

  for (const post of postDefs) {
    for (const lang of langs) {
      const def = post[lang as keyof typeof post] || post[defaultLang as keyof typeof post];
      if (def) {
        posts.push({
          title: def.title,
          slug: post.slug,
          description: def.description,
          content: def.content,
          publishedDate: today,
          categoryIds: categories.sneakers ? [categories.sneakers] : [],
          tagIds: [],
          lang,
        });
      }
    }
  }

  return posts;
}

function generateMenus(defaultLang: string) {
  const isMn = defaultLang === "mn";

  return [
    // Main Navigation
    { kind: "header", label: isMn ? "Нүүр" : "Home", url: "/", order: 1 },
    {
      kind: "header",
      label: isMn ? "Бараа" : "Products",
      url: "/products",
      order: 2,
    },
    { kind: "header", label: isMn ? "Блог" : "Blog", url: "/blog", order: 3 },
    {
      kind: "header",
      label: isMn ? "Бидний тухай" : "About",
      url: "/about",
      order: 4,
    },
    {
      kind: "header",
      label: isMn ? "Холбоо барих" : "Contact",
      url: "/contact",
      order: 5,
    },
    { kind: "header", label: isMn ? "ТАҮ" : "FAQ", url: "/faq", order: 6 },
    // Footer
    {
      kind: "footer",
      label: isMn ? "Бидний тухай" : "About",
      url: "/about",
      order: 1,
    },
    {
      kind: "footer",
      label: isMn ? "Холбоо барих" : "Contact",
      url: "/contact",
      order: 2,
    },
    { kind: "footer", label: isMn ? "ТАҮ" : "FAQ", url: "/faq", order: 3 },
    {
      kind: "footer",
      label: isMn ? "Блог" : "Blog",
      url: "/blog",
      order: 4,
    },
  ];
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});

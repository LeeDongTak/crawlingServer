const puppeteer = require("puppeteer");

exports.crawling = async function (req, res) {
  const { id } = req.params;
  let data = {};
  let browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    slowMo: 10,
  });
  // let browser = puppeteer.launch({ headless: true,  });
  let page = (await browser).newPage();
  await Promise.all([
    (await page).goto(`https://place.map.kakao.com/${id}`),
    (await page).waitForNavigation(),
    (await page).setRequestInterception(true),
    (
      await page
    ).on("request", (req) => {
      if (
        req.resourceType() === "stylesheet" ||
        req.resourceType() === "font" ||
        req.resourceType() === "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    }),
  ]);

  //   대표이미지
  let bannerImgEh = (await page).$("div.details_present > a.link_present");
  let bannerImg = (await bannerImgEh).$eval("span.bg_present", (el) => {
    return el.style.backgroundImage;
  });

  //   평점
  let StarPointEh = (await page).$(
    "div.location_evaluation > a.link_evaluation"
  );
  let StarPoint = (await StarPointEh).$eval("span.color_b", (el) => {
    return el.textContent;
  });

  //   영업시간
  let businessHoursEh = (await page).$(
    "div.placeinfo_default > div.location_detail > div.location_present > div.displayPeriodList > ul.list_operation"
  );
  let businessHours = (await businessHoursEh).$eval(
    "li > span.txt_operation",
    (el) => {
      return el.textContent;
    }
  );

  //   매뉴
  let menuData = [];
  let menuEh = (await page).$$("ul.list_menu > li[data-page='1']");
  for (eh of await menuEh) {
    let menuTitle = (await eh).$eval("span.loss_word", (el) => {
      return el.textContent;
    });
    let menuPrice = (await eh).$eval("em.price_menu", (el) => {
      return el.textContent;
    });
    menuData.push({ menuTitle: await menuTitle, menuPrice: await menuPrice });
  }

  data.bannerImg = await bannerImg;
  data.StarPoint = await StarPoint;
  data.businessHours = await businessHours;
  data.menuData = menuData;

  (await browser).close();

  if (!data) {
    return await res.send({
      isSuccess: false,
      code: 400,
      message: "크롤링 실패 관리자에게 문의하세요",
    });
  }

  return await res.send({
    result: data,
    isSuccess: true,
    code: 200,
    message: "크롤링 성공",
  });
};
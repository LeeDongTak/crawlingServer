const puppeteer = require("puppeteer");

exports.crawling = async function (req, res) {
  const { id } = req.params;
  const data = {};
  let browser;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      slowMo: 10,
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", (req) => {
      if (["stylesheet", "font", "image"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(`https://place.map.kakao.com/${id}`);
    
    // Extracting data...
    data.bannerImg = await page.$eval(
      "div.details_present > a.link_present span.bg_present",
      (el) => el.style.backgroundImage
    );

    data.StarPoint = await page.$eval(
      "div.location_evaluation > a.link_evaluation span.color_b",
      (el) => el.textContent
    );

    data.businessHours = await page.$eval(
      "div.placeinfo_default > div.location_detail > div.location_present > div.displayPeriodList > ul.list_operation li > span.txt_operation",
      (el) => el.textContent
    );

    data.menuData = await page.$$eval(
      "ul.list_menu > li[data-page='1']",
      (elements) => {
        return elements.map((el) => ({
          menuTitle: el.querySelector("span.loss_word").textContent,
          menuPrice: el.querySelector("em.price_menu").textContent,
        }));
      }
    );

    await browser.close();

    if (Object.keys(data).length === 0) {
      return res.send({
        isSuccess: false,
        code: 400,
        message: "크롤링 실패 관리자에게 문의하세요",
      });
    }

    return res.send({
      result: data,
      isSuccess: true,
      code: 200,
      message: "크롤링 성공",
    });
  } catch (error) {
    console.error("웹 스크래핑 중 오류:", error.message);
    if (browser) await browser.close();
    return res.send({
      isSuccess: false,
      code: 500,
      message: "서버 오류",
    });
  }
};
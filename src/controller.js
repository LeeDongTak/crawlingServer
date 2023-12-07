const puppeteer = require("puppeteer");

exports.crawling = async function (req, res) {
  const { id } = req.params;
  let data = {};
  let browser = puppeteer.launch({ headless: true, slowMo: 30 });
  let page = (await browser).newPage();
  await Promise.all([
    (await page).goto(`https://place.map.kakao.com/${id}`),
    (await page).waitForNavigation(),
  ]);
  //   상호명
  let titleEh = (await page).$("div.inner_place");
  let title = (await titleEh).$eval("h2.tit_location", (el) => {
    return el.textContent;
  });
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
  //   주소
  let addressEh = (await page).$("div.placeinfo_default > div.location_detail");
  let address = (await addressEh).$eval("span.txt_address", (el) => {
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
  //   전화번호
  let phoneNumberEh = (await page).$(
    "div.placeinfo_default > div.location_detail > div.location_present > span.num_contact"
  );
  let phoneNumber = (await phoneNumberEh).$eval("span.txt_contact", (el) => {
    return el.textContent;
  });
  //   배달, 포장가능여부
//   let deliveryAndPackagingEh = (await page).$(
//     "div.placeinfo_default:nth-child(7)"
//   );
//   let deliveryAndPackaging = (await deliveryAndPackagingEh).$eval(
//     "div.location_detail",
//     (el) => {
//       return el.textContent;
//     }
//   );
  //   매뉴
  let menuData = [];
  let menuEh = (await page).$$("ul.list_menu > li");
  for (eh of await menuEh) {
    let menuTitle = (await eh).$eval("span.loss_word", (el) => {
      return el.textContent;
    });
    let menuPrice = (await eh).$eval("em.price_menu", (el) => {
      return el.textContent;
    });
    menuData.push({menuTitle: await menuTitle,menuPrice: await menuPrice})
  }

  data.title = await title;
  data.bannerImg = await bannerImg;
  data.StarPoint = await StarPoint;
  data.address = await address;
  data.businessHours = await businessHours;
  data.phoneNumber = await phoneNumber;
//   data.deliveryAndPackaging = await deliveryAndPackaging;
  data.menuData = menuData;

  (await browser).close();

  if (!title) {
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
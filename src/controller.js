const puppeteer = require("puppeteer");

exports.crawling = async function (req, res) {
  const { id } = req.params;
  const data = {};
  let browser;

  try {
    // Puppeteer 브라우저 실행
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      slowMo: 10,
    });

    // 새로운 페이지 생성
    const page = await browser.newPage();

    try {
      // 페이지 이동 및 대기 시간 최적화
      console.log("Debug: Starting page navigation");
      await page.goto(`https://place.map.kakao.com/${id}`, { waitUntil: 'domcontentloaded' });
      console.log("Debug: Page navigation successful");

      // 요소 선택 및 데이터 추출 병렬 처리
      const [bannerImg, StarPoint, businessHours, menuData] = await Promise.all([
        page.$eval('div.details_present > a.link_present span.bg_present', (el) => el.style.backgroundImage),
        page.$eval('div.location_evaluation > a.link_evaluation span.color_b', (el) => el.textContent),
        page.$eval('div.placeinfo_default > div.location_detail > div.location_present > div.displayPeriodList > ul.list_operation li > span.txt_operation', (el) => el.textContent),
        page.$$eval('ul.list_menu > li[data-page="1"]', (elements) => {
          return elements.map((el) => ({
            name: el.querySelector('span.loss_word').textContent,
            price: el.querySelector('em.price_menu').textContent,
          }));
        }),
      ]);

      // 데이터 저장
      data.bannerImg = bannerImg;
      data.vote = StarPoint;
      data.businessHours = businessHours;
      data.menus = menuData;
    } catch (error) {
      // 디버깅을 위한 에러 출력
      console.error("Error during page navigation or data extraction:", error.message);
      throw error;
    } finally {
      // 페이지 닫기
      await page.close();
    }

    // 브라우저 닫기
    await browser.close();

    if (!Object.keys(data).length) {
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
    // 브라우저 닫기 및 에러 응답
    console.error("Error occurred:", error.message);
    if (browser) await browser.close();
    return res.send({
      isSuccess: false,
      code: 500,
      message: "서버 오류"+error,
    });
  }
};
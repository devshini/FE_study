"use strict";

function calculate(){
  
  // 입출력 엘리먼트 찾기
  var amount = document.getElementById("amount");
  var apr = document.getElementById("apr");
  var years = document.getElementById("years");
  var zipcode = document.getElementById("years");
  var payment = document.getElementById("payment");
  var total = document.getElementById("total");
  var totalinterest = documnet.getElementById("totalinterest");


  // 사용자 데이터를 input 엘리먼트로 가져오기 
  var principal = parseFloat(amount.value);
  var interest = parseFloat(apr.value) / 100 / 12;
  var payments = parseFloat(years.value) * 12;

  // 월별 상환금 계산
  var x = Math.pow(1 + interest, payments);
  var monthly = (principal * x * interest) / x -1;

  // 결과값 비교
  // 결과가 유한한 값이냐?
  if(isFinite(monthly)){

    // 출력값을 반올림하여 소수 둘째자리 까지 보여줌
    payment.innerHTML = monthly.toFixed(2); 
    total.innerHTML = (monthly * payments).toFixed(2);
    totalinterest.innerHTML = ((monthly * payments)-principal).toFixed(2);

    // 나중에 방문하면 이전에 입력했던 값들을 보여주기 위해 사용자 입력값을 저장
    save(amount.value, apr.value, years.value, zipcode.value);

    // 광고: 사용자가 위치한 지역에서 대출이 가능한 은행을 찾아 보여준다.
    try {
      // 중괄호 안에 문장이 실행되는 과정에서 에러가 발생하면 모두 걸러냄
      getLenders(amount.value, apr.value, years.value, zipcode.value);
    }
    catch(e){ /* try내에서 발생한 모든 에러르 무시 */ }
  }
  else {
    // 출력결과가 숫자가 아니거나 무한한 값, 사용자가 정보를 다 입력하지 않은 경우 아무것도 출력안함
    payment.innerHTML = ""; // 엘리먼트 내용을 지운다
    total.innerHTML = "";
    totalinterest = "";
    chart(); // 전달인자가 없으면 차트를 지운다.
  }
}

// 사용자가 입력한 데이터를 localStorage 객체의 프로퍼티로 저장 (사용자가 추후 방문시 보여줌)
// HTTP로 실행시 정상적으로 작동함
function save(amount, apr, years, zipcode){
  if(window.localStorage) {
    // 브라우저가 해당 기능을 지원하면 사용
    localStorage.loan_amount = amount;
    localStorage.loan_apr = apr;
    localStorage.loan_years = years;
    localStorage.loan_zipcode = zipcode;
  }
}

// 문서의 로딩이 완료되었을 때, 과거의 사용자가 입력한 값이 있으면 복원한다.
window.onload = function(){
  // 브라우저가 localStorage 기능 지원, 저장 데이터가 있을 경우
  if(window.localStorage && localStorage.loan_amount) {
    document.getElementById("amount").value = localStorage.loan_amount;
    document.getElementById("apr").value = localStorage.loan_apr;
    document.getElementById("years").value = localStorage.loan_years;
    document.getElementById("zipcode").value = localStorage.loan_zipcode;
  }
};

// 사용자가 입력한 값ㅇ르 서버 측 스크립트에 전달하면, 서버 측에서는 사용자가 위치한 지역에서 대출이
// 가능한 대부업체 목록을 반환한다고 가정
function getLenders(amount, apr, years, zipcode){
  // 브라우저가 XMLHttpRequest 객체를 지원하지 않으면 아무일도 일어나지 않음
  if(!window.XMLHttpRequest) return;

  // 대부업체 목록을 출력할 엘리먼트를 찾음
  var ad = document.getElementById("lenders");
  if (!ad) return; // 출력을 위한 엘리먼트가 없으면 종료

  // 사용자가 입력한 값을 URL에 질의 매개변수로 인코딩
  //해당 서비스의 URL에 사용자 데이터를 질의 문자열로 추가
  var url = "getLenders.php" +
    "?amt" + encodeURIComponent(amount) +
    "&apr" + encodeURIComponent(apr) +
    "&yrs" + encodeURIComponent(years) +
    "&zip" + encodeURIComponent(zipcode);

  // XMLHttpRequest 객체를 사용해 앞에서 만든 URL을 통해 정보를 가져옴
  var req = new XMLHttpRequest(); // 새 요청을 시작
  req.open("GET", url); // 해당 URL로 서버 측에 HTTP GET 요청을 보낸다.
  req.send(null); // URL에 필요한 정보를 실어서 요청을 보냈기 때문에 따로 내용은 보내지 않음


  // 서버로부터 응답을 받기 전, 응답을 처리할 이벤트 핸들러 함수를 등록
  // 이벤트핸들러함수는 일정시간이 지난 후 서버에서 HTTP응답이 오면 바로 호출된다.
  req.onreadystatechange = function(){
    if(req.readyState == 4 && req.status == 200){
      var response = req.responseText; // HTTP응답을 문자열로 처리한다.
      var lenders = JSON.parse(response) // 문자열을 자바스크립트 배열로 처리

      // 대부업체 정보가 담긴 배열을 HTML 문자열로 변환
      var list = "";
      for(var i = 0; i < lenders.length; i++){
        list += "<li><a href='" + lenders[i].url + "'>" + lenders[i].name + "</a>"; 
      }

      // 최종 HTML 문자열을 화면에 출력
      ad.innerHTML = "<ul>" + list + "</ul>";
    }
  }
}

// 월별 대출 잔액, 이자, 자본을 HTML <canvas> 엘리먼트 안에 차트 그리기
// 전달 인자 없이 호출 시 화면에 차트를 지움
function chart(principal, interest, monthly, payments){
  var graph = document.getElementById("graph"); // canvas태그를 가져 옴
  graph.width = graph.width; // 엘리먼트 초기화

  // 전달인자 없이 호출, 브라우저가 canvas 지원하지 않으면 함수 종료
  if(arguments.length == 0 || !graph.getContext) return;

  // 드로잉 API를 제공하는 canvas에서 context 객체를 가져온다
  var g = graph.getContext("2d"); // 모든 드로잉은 이 객체를 통해 이루어짐
  var width = graph.width, height = graph.height; // canvas 크기 가져옴

  // 지불연도, 달러를 픽셀로 변환
  function paymentToX(n) {return n * width / payments;}
  function amountToY(a) {return height-(a * height / (monthly * payments * 1.05));}

  // 지불 선은 (0,0) 에서 시작해 (payments, monthly * payments) 까지 직선으로 표현
  g.moveTo(paymentToX(0), amountToY(0)); 
  g.lineTo(paymentToX(payments), amountToY(monthly * payments));
  g.lineTo(paymentToX(payments), amountToY(0));
  g.closePath();
  g.fillStyle = "#f88";
  g.fill();
  g.font = "bold 12px sans-serif";
  g.fillText("Total Interest Payments", 20,20);

  // 금액은 곡선으로 그리고 차트에 진하게 표시
  var equity = 0;
  g.beginPath();
  g.moveTo(paymentToX(0), amountToY(0));
  for(var p = 1; p <= payments; p++){
    // 매번 납입할 때마다 이자 계산
    var thisMonthsInterest = (principal - equity) * interest;
    equity += (monthly - thisMonthsInterest);
    g.lineTo(paymentToX(p),amountToY(equity));
  }
  g.lineTo(paymentToX(payments), amountToY(0));
  g.closePath();
  g.fillStyle = "green";
  g.fill();

  g.fillText("Total Equity", 20, 25);

  // 그리는 시작점을 원점으로 되돌림
  var bal = principal;
  g.beginPath();
  g.moveTo(paymentToX(0), amountToY(bal));
  for(var p = 1; p <= payments; p++){
    var thisMonthsInterest = bal * interest;
    bal -= (monthly - thisMonthsInterest);
    g.lineTo(paymentToX(p), amountToY(bal));
  }
  g.lineWidth = 3;
  g.stroke();

  g.fillStyle = "black";
  g.fillText("Loan Balance", 20,50);

  // x축에 연도를 눈금선으로 그리기
  g.textAlign="center";

  var y = amountToY(0);
  for(var year= 1; year * 12 <= payments; year++){
    var x = paymentToX(year * 12);
    g.fillRect(x-0.5, y-3,1,3);
    if(year == 1) g.fillText("Year", x, y-5);
    if(year % 5 == 0 && year * 12 !== payments) g.fillText(String(year), x, y-5);
  }

  // Y축에 압입할 금액을 표시
  g.textAlign = "right";

  g.textBaseline = "middle";

  var ticks = [monthly * payments, principal];
  var rightEdge = paymentToX(payments);
  for (var i = 0; i < ticks.length; i++){
    var y = amountToY(ticks[i]);

    g.fillRect(rightEdge-3, y-0.5, 3,1);
    g.fillText(String(ticks[i].toFixed(0)), rightEdge-5, y);
  }
}
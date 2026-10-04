
// =========================
// Supabase 雲端資料庫設定
// =========================

// Supabase 專案網址
const SUPABASE_URL =
    "https://ilplovmomqblgqopihce.supabase.co";

// Supabase anon public key
// 請使用你目前 material.js 裡面的同一個 anon public key
const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscGxvdm1vbXFibGdxb3BpaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzMxMjEsImV4cCI6MjEwNjYwOTEyMX0.GzszzXgUmF_Jq2dDH9QI61zUGuiy968ufzZM3H2qGoU";


// =========================
// Supabase API 網址
// =========================

// materials 資料表的 API 網址
const MATERIALS_API =
    SUPABASE_URL + "/rest/v1/materials";

// quotations 資料表的 API 網址
const QUOTATIONS_API =
    SUPABASE_URL + "/rest/v1/quotations";

// quotation_items 資料表的 API 網址
const QUOTATION_ITEMS_API =
    SUPABASE_URL + "/rest/v1/quotation_items";


// =========================
// 儲存材料資料
// =========================

let materials = [];


// =========================
// 建立 Supabase Request Headers
// =========================

function getHeaders() {

    return {

        // Supabase API Key
        "apikey": SUPABASE_KEY,

        // Authorization
        "Authorization":
            "Bearer " + SUPABASE_KEY,

        // 告訴 Supabase 傳送的是 JSON
        "Content-Type":
            "application/json"

    };

}


// =========================
// 取得目前估價單 ID
// =========================

const currentQuotationId =
    localStorage.getItem(
        "currentQuotationId"
    );


// =========================
// 如果沒有估價單 ID
// 就回到估價單管理頁
// =========================

if (!currentQuotationId) {

    alert(
        "目前沒有選擇估價單，將返回估價單管理頁。"
    );

    window.location.href =
        "quotation.html";

}


// =========================
// 取得 HTML 元素
// =========================

// 取得材料表格
const materialTable =
    document.getElementById(
        "materialTable"
    );

// 取得新增材料按鈕
const addRowButton =
    document.getElementById(
        "addRow"
    );

// 取得匯出 PDF 按鈕
const printQuotationButton =
    document.getElementById(
        "printQuotation"
    );

// 取得儲存估價單按鈕
const saveQuotationButton =
    document.getElementById(
        "saveQuotation"
    );

// 取得工程名稱輸入框
const projectNameInput =
    document.getElementById(
        "projectName"
    );

// 取得工程日期輸入框
const projectDateInput =
    document.getElementById(
        "projectDate"
    );

// 取得工程地址輸入框
const projectAddressInput =
    document.getElementById(
        "projectAddress"
    );


// =========================
// 取得今天日期
// =========================

function getTodayDate() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


// =========================
// 從 Supabase 取得材料
// =========================

async function loadMaterials() {

    try {

        // 向 Supabase 取得所有材料
        const response =
            await fetch(
                MATERIALS_API +
                "?select=*&order=id.asc",
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        // 如果取得失敗
        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "Supabase 材料資料錯誤：",
                errorText
            );

            throw new Error(
                errorText
            );

        }


        // 將 Supabase 回傳資料轉成 JavaScript
        materials =
            await response.json();


        console.log(
            "已取得材料數量：",
            materials.length
        );

    }

    catch (error) {

        console.error(
            "取得雲端材料失敗：",
            error
        );

        materials = [];

    }

}


// =========================
// 計算某一列的金額
// =========================

function calculateRow(row) {

    const quantityInput =
        row.querySelector(
            ".quantity"
        );

    const priceInput =
        row.querySelector(
            ".price"
        );

    const amountInput =
        row.querySelector(
            ".amount"
        );


    if (
        !quantityInput ||
        !priceInput ||
        !amountInput
    ) {

        return;

    }


    const quantity =
        Number(
            quantityInput.value
        ) || 0;

    const price =
        Number(
            priceInput.value
        ) || 0;


    const amount =
        quantity * price;


    amountInput.value =
        amount;


    // 重新計算總金額
    calculateTotal();

}


// =========================
// 計算全部材料的總金額
// =========================

function calculateTotal() {

    const rows =
        document.querySelectorAll(
            "#materialTable tr"
        );


    let total = 0;


    rows.forEach(
        function(row) {

            const amountInput =
                row.querySelector(
                    ".amount"
                );


            // 如果找不到金額欄位就跳過
            if (!amountInput) {

                return;

            }


            const amount =
                Number(
                    amountInput.value
                ) || 0;


            total += amount;

        }
    );


    const totalAmount =
        document.getElementById(
            "totalAmount"
        );


    if (totalAmount) {

        totalAmount.textContent =
            total.toLocaleString();

    }

}


// =========================
// 儲存估價單狀態
// =========================

let savingQuotation = false;

let savePending = false;

let saveTimer = null;


// =========================
// 真正執行雲端儲存
// =========================

async function saveQuotation() {

    // 如果目前正在儲存
    if (savingQuotation) {

        savePending = true;

        return false;

    }


    savingQuotation = true;


    try {

        // =========================
        // 取得所有材料列
        // =========================

        const rows =
            document.querySelectorAll(
                "#materialTable tr"
            );


        const quotationItems = [];


        // =========================
        // 建立材料明細資料
        // =========================

        rows.forEach(
            function(row) {

                const materialDateInput =
                    row.querySelector(
                        ".materialDate"
                    );

                const nameInput =
                    row.querySelector(
                        ".name"
                    );

                const specInput =
                    row.querySelector(
                        ".spec"
                    );

                const quantityInput =
                    row.querySelector(
                        ".quantity"
                    );

                const priceInput =
                    row.querySelector(
                        ".price"
                    );

                const amountInput =
                    row.querySelector(
                        ".amount"
                    );

                const remarkInput =
                    row.querySelector(
                        ".remark"
                    );


                // 如果欄位不存在就跳過
                if (
                    !nameInput ||
                    !specInput ||
                    !quantityInput ||
                    !priceInput ||
                    !amountInput ||
                    !remarkInput
                ) {

                    return;

                }


                // 取得材料日期
                const materialDate =
                    materialDateInput
                        ? materialDateInput.value
                        : "";


                const name =
                    nameInput.value.trim();


                const spec =
                    specInput.value.trim();


                const quantity =
                    Number(
                        quantityInput.value
                    ) || 0;


                const price =
                    Number(
                        priceInput.value
                    ) || 0;


                const amount =
                    Number(
                        amountInput.value
                    ) || 0;


                const remark =
                    remarkInput.value.trim();


                // =========================
                // 如果整列都是空的
                // 就不儲存這一列
                // =========================

                if (
                    materialDate === "" &&
                    name === "" &&
                    spec === "" &&
                    quantity === 0 &&
                    price === 0 &&
                    remark === ""
                ) {

                    return;

                }


                // =========================
                // 加入材料

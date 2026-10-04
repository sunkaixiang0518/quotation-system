
// =========================
// Supabase 雲端資料庫設定
// =========================

// Supabase 專案網址
const SUPABASE_URL =
    "https://ilplovmomqblgqopihce.supabase.co";

// Supabase anon public key
// 請貼上你目前 material.js 使用的 anon public key
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
        "apikey":
            SUPABASE_KEY,

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
            total;

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

        return;

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
                // 加入材料明細
                // =========================

                quotationItems.push({

                    // 估價單 ID
                    quotation_id:
                        Number(
                            currentQuotationId
                        ),

                    // 材料使用日期
                    material_date:
                        materialDate ||
                        null,

                    // 品名
                    name:
                        name,

                    // 規格
                    spec:
                        spec,

                    // 數量
                    quantity:
                        quantity,

                    // 單價
                    price:
                        price,

                    // 金額
                    amount:
                        amount,

                    // 備註
                    remark:
                        remark

                });

            }
        );


        // =========================
        // 更新工程基本資料
        // =========================

        const quotationData = {

            // 工程名稱
            project_name:
                projectNameInput.value.trim(),

            // 工程日期
            project_date:
                projectDateInput.value ||
                null,

            // 工程地址
            project_address:
                projectAddressInput.value.trim()

        };


        const quotationResponse =
            await fetch(
                QUOTATIONS_API +
                "?id=eq." +
                currentQuotationId,
                {
                    method: "PATCH",

                    headers: getHeaders(),

                    body:
                        JSON.stringify(
                            quotationData
                        )

                }
            );


        // 如果更新估價單失敗
        if (!quotationResponse.ok) {

            const errorText =
                await quotationResponse.text();

            console.error(
                "更新估價單失敗：",
                errorText
            );

            throw new Error(
                errorText
            );

        }


        // =========================
        // 先刪除舊的材料明細
        // =========================

        const deleteItemsResponse =
            await fetch(
                QUOTATION_ITEMS_API +
                "?quotation_id=eq." +
                currentQuotationId,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );


        // 如果刪除舊材料失敗
        if (!deleteItemsResponse.ok) {

            const errorText =
                await deleteItemsResponse.text();

            console.error(
                "刪除舊估價單明細失敗：",
                errorText
            );

            throw new Error(
                errorText
            );

        }


        // =========================
        // 如果有材料
        // 就重新寫入雲端
        // =========================

        if (
            quotationItems.length > 0
        ) {

            const insertItemsResponse =
                await fetch(
                    QUOTATION_ITEMS_API,
                    {
                        method: "POST",

                        // 告訴 Supabase
                        // 新增後回傳資料
                        headers: {

                            ...getHeaders(),

                            "Prefer":
                                "return=representation"

                        },

                        body:
                            JSON.stringify(
                                quotationItems
                            )

                    }
                );


            // 如果新增材料失敗
            if (
                !insertItemsResponse.ok
            ) {

                const errorText =
                    await insertItemsResponse.text();

                console.error(
                    "儲存估價單材料失敗：",
                    errorText
                );

                throw new Error(
                    errorText
                );

            }

        }


        console.log(
            "估價單已儲存到 Supabase"
        );


        return true;

    }

    catch (error) {

        console.error(
            "儲存估價單失敗：",
            error
        );

        alert(
            "儲存估價單失敗，請稍後再試。"
        );

        return false;

    }

    finally {

        savingQuotation = false;


        // 如果儲存過程中
        // 又有新的修改
        if (savePending) {

            savePending = false;

            saveQuotation();

        }

    }

}


// =========================
// 延遲儲存估價單
// =========================

function scheduleSaveQuotation() {

    // 清除之前的計時器
    clearTimeout(
        saveTimer
    );


    // 等使用者停止輸入 500 毫秒
    // 再儲存資料
    saveTimer =
        setTimeout(
            function() {

                saveQuotation();

            },
            500
        );

}


// =========================
// 設定一列材料的功能
// =========================

function setupRow(row) {

    // 如果沒有這一列就停止
    if (!row) {

        return;

    }


    // 取得材料日期輸入框
    const materialDateInput =
        row.querySelector(
            ".materialDate"
        );


    // 取得品名輸入框
    const nameInput =
        row.querySelector(
            ".name"
        );


    // 取得規格輸入框
    const specInput =
        row.querySelector(
            ".spec"
        );


    // 取得數量輸入框
    const quantityInput =
        row.querySelector(
            ".quantity"
        );


    // 取得單價輸入框
    const priceInput =
        row.querySelector(
            ".price"
        );


    // 取得備註輸入框
    const remarkInput =
        row.querySelector(
            ".remark"
        );


    // 取得材料搜尋結果區域
    const suggestionBox =
        row.querySelector(
            ".materialSuggestions"
        );


    // 取得刪除按鈕
    const deleteButton =
        row.querySelector(
            ".deleteRow"
        );


    // =========================
    // 材料日期修改
    // =========================

    if (materialDateInput) {

        materialDateInput.addEventListener(
            "change",
            function() {

                // 使用日期選擇器選擇日期後
                // 自動儲存估價單
                scheduleSaveQuotation();

            }
        );


        // =========================
        // 點擊日期欄位
        // 自動開啟日曆選擇器
        // =========================

        materialDateInput.addEventListener(
            "click",
            function() {

                // 如果瀏覽器支援 showPicker()
                // 就直接開啟日期選擇器
                if (
                    typeof materialDateInput.showPicker ===
                    "function"
                ) {

                    try {

                        materialDateInput.showPicker();

                    }

                    catch (error) {

                        // 某些瀏覽器可能不允許重複開啟
                        console.log(
                            "日期選擇器由瀏覽器處理"
                        );

                    }

                }

            }
        );

    }


    // =========================
    // 輸入材料名稱
    // =========================

    if (nameInput) {

        nameInput.addEventListener(
            "input",
            function() {

                // 取得輸入的文字
                const keyword =
                    nameInput.value.trim();


                // 清空舊的搜尋結果
                suggestionBox.innerHTML =
                    "";


                // 如果沒有輸入文字
                if (keyword === "") {

                    scheduleSaveQuotation();

                    return;

                }


                // =========================
                // 找出可能的材料
                // =========================

                const results =
                    materials.filter(
                        function(item) {

                            // 確保材料名稱存在
                            if (!item.name) {

                                return false;

                            }


                            // 材料名稱包含搜尋文字
                            return item.name
                                .toLowerCase()
                                .includes(
                                    keyword.toLowerCase()
                                );

                        }
                    );


                // =========================
                // 顯示材料選項
                // =========================

                results.forEach(
                    function(item) {

                        const suggestion =
                            document.createElement(
                                "div"
                            );


                        // 顯示材料名稱和價格
                        suggestion.textContent =
                            item.name +
                            "  $" +
                            item.price;


                        // =========================
                        // 點選材料
                        // =========================

                        suggestion.addEventListener(
                            "mousedown",
                            function(event) {

                                // 防止輸入框失去焦點
                                event.preventDefault();

                            }
                        );


                        suggestion.addEventListener(
                            "click",
                            function() {

                                // 填入材料名稱
                                nameInput.value =
                                    item.name;


                                // 填入規格
                                specInput.value =
                                    item.spec ||
                                    "";


                                // 填入單價
                                priceInput.value =
                                    item.price ||
                                    0;


                                // 計算金額
                                calculateRow(
                                    row
                                );


                                // 清除搜尋結果
                                suggestionBox.innerHTML =
                                    "";


                                // 儲存估價單
                                scheduleSaveQuotation();

                            }
                        );


                        // 加入搜尋結果
                        suggestionBox.appendChild(
                            suggestion
                        );

                    }
                );


                // =========================
                // 沒有找到材料
                // =========================

                if (
                    results.length === 0
                ) {

                    const noResult =
                        document.createElement(
                            "div"
                        );


                    noResult.textContent =
                        "找不到已儲存的材料";


                    noResult.style.color =
                        "#999";


                    suggestionBox.appendChild(
                        noResult
                    );

                }

            }
        );


        // =========================
        // 品名失去焦點
        // =========================

        nameInput.addEventListener(
            "blur",
            function() {

                // 稍微延遲
                // 讓使用者可以點選搜尋結果
                setTimeout(
                    function() {

                        suggestionBox.innerHTML =
                            "";

                    },
                    200
                );

            }
        );

    }


    // =========================
    // 規格修改
    // =========================

    if (specInput) {

        specInput.addEventListener(
            "input",
            function() {

                scheduleSaveQuotation();

            }
        );

    }


    // =========================
    // 數量修改
    // =========================

    if (quantityInput) {

        quantityInput.addEventListener(
            "input",
            function() {

                // 重新計算金額
                calculateRow(
                    row
                );


                // 儲存估價單
                scheduleSaveQuotation();

            }
        );

    }


    // =========================
    // 單價修改
    // =========================

    if (priceInput) {

        priceInput.addEventListener(
            "input",
            function() {

                // 重新計算金額
                calculateRow(
                    row
                );


                // 儲存估價單
                scheduleSaveQuotation();

            }
        );

    }


    // =========================
    // 備註修改
    // =========================

    if (remarkInput) {

        remarkInput.addEventListener(
            "input",
            function() {

                scheduleSaveQuotation();

            }
        );

    }


    // =========================
    // 刪除材料列
    // =========================

    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            function() {

                // 如果目前只有一列
                if (
                    materialTable.querySelectorAll(
                        "tr"
                    ).length <= 1
                ) {

                    // 不刪除最後一列
                    // 只清空資料
                    if (materialDateInput) {

                        materialDateInput.value =
                            "";

                    }

                    nameInput.value =
                        "";

                    specInput.value =
                        "";

                    quantityInput.value =
                        "";

                    priceInput.value =
                        "";

                    row.querySelector(
                        ".amount"
                    ).value =
                        "";

                    remarkInput.value =
                        "";


                    calculateTotal();

                    scheduleSaveQuotation();

                    return;

                }


                // 刪除這一列
                row.remove();


                // 重新計算總金額
                calculateTotal();


                // 儲存估價單
                scheduleSaveQuotation();

            }
        );

    }

}


// =========================
// 新增材料列
// =========================

function addRow(materialDate = null) {

    const row =
        document.createElement(
            "tr"
        );


    // 如果沒有指定日期
    // 新增材料時預設使用今天
    const dateValue =
        materialDate ||
        getTodayDate();


    row.innerHTML = `

        <!-- =========================
             材料日期
             ========================= -->

        <td>

            <input
                type="date"
                class="materialDate"
                value="${dateValue}"
            >

        </td>


        <!-- =========================
             品名
             ========================= -->

        <td style="position: relative;">

            <input
                type="text"
                class="name"
                autocomplete="off"
            >

            <div class="materialSuggestions"></div>

        </td>


        <!-- =========================
             規格
             ========================= -->

        <td>

            <input
                type="text"
                class="spec"
            >

        </td>


        <!-- =========================
             數量
             ========================= -->

        <td>

            <input
                type="number"
                class="quantity"
            >

        </td>


        <!-- =========================
             單價
             ========================= -->

        <td>

            <input
                type="number"
                class="price"
            >

        </td>


        <!-- =========================
             金額
             ========================= -->

        <td>

            <input
                type="number"
                class="amount"
                readonly
            >

        </td>


        <!-- =========================
             備註
             ========================= -->

        <td>

            <input
                type="text"
                class="remark"
            >

        </td>


        <!-- =========================
             操作
             ========================= -->

        <td class="operation-column">

            <button
                type="button"
                class="deleteRow"
            >
                刪除
            </button>

        </td>

    `;


    // 將新的一列加入表格
    materialTable.appendChild(
        row
    );


    // 設定這一列的功能
    setupRow(
        row
    );


    // 重新計算總金額
    calculateTotal();


    return row;

}


// =========================
// 從 Supabase 載入目前估價單
// =========================

async function loadQuotation() {

    try {

        // =========================
        // 取得估價單基本資料
        // =========================

        const quotationResponse =
            await fetch(
                QUOTATIONS_API +
                "?id=eq." +
                currentQuotationId +
                "&select=*",
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        if (!quotationResponse.ok) {

            const errorText =
                await quotationResponse.text();

            throw new Error(
                errorText
            );

        }


        const quotations =
            await quotationResponse.json();


        // 如果找不到估價單
        if (
            quotations.length === 0
        ) {

            alert(
                "找不到這張估價單。"
            );

            window.location.href =
                "quotation.html";

            return;

        }


        const quotation =
            quotations[0];


        // =========================
        // 填入工程基本資料
        // =========================

        projectNameInput.value =
            quotation.project_name ||
            "";


        projectDateInput.value =
            quotation.project_date ||
            "";


        projectAddressInput.value =
            quotation.project_address ||
            "";


        // =========================
        // 取得材料明細
        // =========================

        const itemsResponse =
            await fetch(
                QUOTATION_ITEMS_API +
                "?quotation_id=eq." +
                currentQuotationId +
               

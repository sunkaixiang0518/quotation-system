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
// 從材料資料庫取得材料資料
// =========================

// 儲存目前從 Supabase 取得的材料
let materials = [];


// =========================
// 建立 Supabase Request Headers
// =========================

// 建立 Supabase API 要使用的標頭
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
// 取得目前正在使用的估價單 ID
// =========================

// 從瀏覽器取得目前估價單 ID
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
    document.getElementById("materialTable");

// 取得新增材料按鈕
const addRowButton =
    document.getElementById("addRow");

// 取得匯出 PDF 按鈕
const printQuotationButton =
    document.getElementById("printQuotation");

// 取得儲存估價單按鈕
const saveQuotationButton =
    document.getElementById("saveQuotation");

// 取得工程名稱輸入框
const projectNameInput =
    document.getElementById("projectName");

// 取得工程日期輸入框
const projectDateInput =
    document.getElementById("projectDate");

// 取得工程地址輸入框
const projectAddressInput =
    document.getElementById("projectAddress");


// =========================
// 從 Supabase 取得材料
// =========================

// 從 Supabase 取得最新材料
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


        // 顯示目前取得的材料數量
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

        // 材料資料取得失敗時
        // 不讓整個估價單停止運作
        materials = [];

    }

}


// =========================
// 計算某一列的金額
// =========================

function calculateRow(row) {

    const quantity =
        Number(
            row.querySelector(".quantity").value
        ) || 0;

    const price =
        Number(
            row.querySelector(".price").value
        ) || 0;

    const amount =
        quantity * price;

    row.querySelector(".amount").value =
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

    rows.forEach(function(row) {

        const amountInput =
            row.querySelector(".amount");

        // 如果找不到金額欄位就跳過
        if (!amountInput) {

            return;

        }

        const amount =
            Number(
                amountInput.value
            ) || 0;

        total += amount;

    });

    document.querySelector(
        "#totalAmount"
    ).textContent = total;

}


// =========================
// 儲存估價單到 Supabase
// =========================

// 避免同一時間重複儲存
let savingQuotation = false;

// 記錄是否有等待儲存的資料
let savePending = false;


// =========================
// 真正執行雲端儲存
// =========================

async function saveQuotation() {

    // 如果目前正在儲存
    if (savingQuotation) {

        // 記錄這次還需要再儲存
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

        rows.forEach(function(row) {

            const name =
                row.querySelector(
                    ".name"
                ).value.trim();

            const spec =
                row.querySelector(
                    ".spec"
                ).value.trim();

            const quantity =
                Number(
                    row.querySelector(
                        ".quantity"
                    ).value
                ) || 0;

            const price =
                Number(
                    row.querySelector(
                        ".price"
                    ).value
                ) || 0;

            const amount =
                Number(
                    row.querySelector(
                        ".amount"
                    ).value
                ) || 0;

            const remark =
                row.querySelector(
                    ".remark"
                ).value.trim();


            // =========================
            // 如果整列都是空的
            // 就不儲存這一列
            // =========================

            if (
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

        });


        // =========================
        // 更新 quotations
        // =========================

        const quotationData = {

            // 工程名稱
            project_name:
                projectNameInput.value,

            // 工程日期
            project_date:
                projectDateInput.value ||
                null,

            // 工程地址
            project_address:
                projectAddressInput.value

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

    }

    catch (error) {

        console.error(
            "儲存估價單失敗：",
            error
        );

        throw error;

    }

    finally {

        savingQuotation = false;


        // 如果儲存過程中
        // 又有新的修改
        if (savePending) {

            savePending = false;

            // 再儲存一次
            saveQuotation();

        }

    }

}


// =========================
// 延遲儲存估價單
// =========================

// 避免每打一個字
// 就立刻向 Supabase 發送請求
let saveTimer = null;


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


    // 取得品名輸入框
    const nameInput =
        row.querySelector(".name");

    // 取得規格輸入框
    const specInput =
        row.querySelector(".spec");

    // 取得數量輸入框
    const quantityInput =
        row.querySelector(".quantity");

    // 取得單價輸入框
    const priceInput =
        row.querySelector(".price");

    // 取得備註輸入框
    const remarkInput =
        row.querySelector(".remark");

    // 取得材料搜尋結果區域
    const suggestionBox =
        row.querySelector(
            ".materialSuggestions"
        );

    // 取得刪除按鈕
    const deleteButton =
        row.querySelector(".deleteRow");


    // =========================
    // 輸入材料名稱
    // =========================

    nameInput.addEventListener(
        "input",
        function() {

            // 取得輸入的文字
            const keyword =
                nameInput.value.trim();

            // 清空舊的搜尋結果
            suggestionBox.innerHTML = "";


            // 如果沒有輸入文字
            if (keyword === "") {

                // 延遲儲存目前資料
                scheduleSaveQuotation();

                return;

            }


            // =========================
            // 找出可能的材料
            // =========================

            const results =
                materials.filter(
                    function(item) {

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
                        "click",
                        function() {

                            // 填入材料名稱
                            nameInput.value =
                                item.name;

                            // 填入規格
                            specInput.value =
                                item.spec || "";

                            // 填入單價
                            priceInput.value =
                                item.price;

                            // 清除搜尋結果
                            suggestionBox.innerHTML =
                                "";

                            // 計算金額
                            calculateRow(row);

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
            // 完整輸入材料名稱時
            // 自動帶出資料
            // =========================

            const material =
                materials.find(
                    function(item) {

                        return item.name ===
                            keyword;

                    }
                );


            if (material) {

                // 自動帶出規格
                specInput.value =
                    material.spec || "";

                // 自動帶出單價
                priceInput.value =
                    material.price;

                // 計算金額
                calculateRow(row);

            }


            // 儲存估價單
            scheduleSaveQuotation();

        }
    );


    // =========================
    // 輸入數量
    // =========================

    quantityInput.addEventListener(
        "input",
        function() {

            calculateRow(row);

            // 儲存估價單
            scheduleSaveQuotation();

        }
    );


    // =========================
    // 修改單價
    // =========================

    priceInput.addEventListener(
        "input",
        function() {

            calculateRow(row);

            // 儲存估價單
            scheduleSaveQuotation();

        }
    );


    // =========================
    // 修改規格
    // =========================

    specInput.addEventListener(
        "input",
        function() {

            // 儲存估價單
            scheduleSaveQuotation();

        }
    );


    // =========================
    // 修改備註
    // =========================

    remarkInput.addEventListener(
        "input",
        function() {

            // 儲存估價單
            scheduleSaveQuotation();

        }
    );


    // =========================
    // 刪除這一列
    // =========================

    deleteButton.addEventListener(
        "click",
        function() {

            // 刪除這一列
            row.remove();

            // 重新計算總金額
            calculateTotal();

            // 儲存估價單
            saveQuotation();

        }
    );

}


// =========================
// 新增材料列
// =========================

function addRow() {

    // 建立新的表格列
    const row =
        document.createElement("tr");


    // 建立這一列的 HTML
    row.innerHTML = `

        <td style="position: relative;">

            <input
                type="text"
                class="name"
            >

            <div
                class="materialSuggestions">
            </div>

        </td>

        <td>

            <input
                type="text"
                class="spec"
            >

        </td>

        <td>

            <input
                type="number"
                class="quantity"
            >

        </td>

        <td>

            <input
                type="number"
                class="price"
            >

        </td>

        <td>

            <input
                type="number"
                class="amount"
                readonly
            >

        </td>

        <td>

            <input
                type="text"
                class="remark"
            >

        </td>

        <!-- 操作欄 -->

        <td class="operation-column">

            <button
                class="deleteRow"
            >
                刪除
            </button>

        </td>

    `;


    // 把新的列加入表格
    materialTable.appendChild(row);


    // 設定這一列的功能
    setupRow(row);

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


        // 如果取得失敗
        if (!quotationResponse.ok) {

            const errorText =
                await quotationResponse.text();

            console.error(
                "取得估價單失敗：",
                errorText
            );

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


        // 取得目前估價單
        const quotation =
            quotations[0];


        // =========================
        // 恢復工程名稱
        // =========================

        projectNameInput.value =
            quotation.project_name ||
            "";


        // =========================
        // 恢復工程日期
        // =========================

        projectDateInput.value =
            quotation.project_date ||
            "";


        // =========================
        // 恢復工程地址
        // =========================

        projectAddressInput.value =
            quotation.project_address ||
            "";


        // =========================
        // 取得估價單材料明細
        // =========================

        const itemsResponse =
            await fetch(
                QUOTATION_ITEMS_API +
                "?quotation_id=eq." +
                currentQuotationId +
                "&select=*&order=id.asc",
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        // 如果取得材料失敗
        if (!itemsResponse.ok) {

            const errorText =
                await itemsResponse.text();

            console.error(
                "取得估價單材料失敗：",
                errorText
            );

            throw new Error(
                errorText
            );

        }


        const quotationItems =
            await itemsResponse.json();


        // =========================
        // 清除原本的材料列
        // =========================

        materialTable.innerHTML = "";


        // =========================
        // 如果沒有材料
        // 建立一個空白列
        // =========================

        if (
            quotationItems.length === 0
        ) {

            addRow();

        }


        // =========================
        // 恢復所有材料
        // =========================

        quotationItems.forEach(
            function(item) {

                // 新增一列
                addRow();


                // 取得最後一列
                const rows =
                    document.querySelectorAll(
                        "#materialTable tr"
                    );

                const row =
                    rows[
                        rows.length - 1
                    ];


                // =========================
                // 恢復品名
                // =========================

                row.querySelector(
                    ".name"
                ).value =
                    item.name || "";


                // =========================
                // 恢復規格
                // =========================

                row.querySelector(
                    ".spec"
                ).value =
                    item.spec || "";


                // =========================
                // 恢復數量
                // =========================

                row.querySelector(
                    ".quantity"
                ).value =
                    item.quantity ?? "";


                // =========================
                // 恢復單價
                // =========================

                row.querySelector(
                    ".price"
                ).value =
                    item.price ?? "";


                // =========================
                // 恢復備註
                // =========================

                row.querySelector(
                    ".remark"
                ).value =
                    item.remark || "";


                // =========================
                // 重新計算金額
                // =========================

                calculateRow(row);

            }
        );


        // 重新計算總金額
        calculateTotal();


        console.log(
            "估價單載入成功：",
            currentQuotationId
        );

    }

    catch (error) {

        console.error(
            "載入估價單失敗：",
            error
        );

        alert(
            "載入估價單失敗，請查看瀏覽器主控台。"
        );

    }

}


// =========================
// 材料資料庫更新時
// 自動更新估價單價格
// =========================

// Supabase 不會使用原本的 storage 事件
// 因此這裡改成重新從雲端取得材料資料
async function refreshMaterials() {

    // 重新取得最新材料
    await loadMaterials();


    // 取得估價單所有列
    const rows =
        document.querySelectorAll(
            "#materialTable tr"
        );


    rows.forEach(function(row) {

        // 取得品名
        const nameInput =
            row.querySelector(".name");

        // 取得單價
        const priceInput =
            row.querySelector(".price");


        // 沒有品名就跳過
        if (
            nameInput.value === ""
        ) {

            return;

        }


        // 找到材料資料庫中的材料
        const material =
            materials.find(
                function(item) {

                    return item.name ===
                        nameInput.value;

                }
            );


        // 如果找到
        if (material) {

            // 更新單價
            priceInput.value =
                material.price;

            // 重新計算金額
            calculateRow(row);

        }

    });


    // 儲存更新後的估價單
    scheduleSaveQuotation();

}


// =========================
// 設定原本第一列
// =========================

const firstRow =
    document.querySelector(
        "#materialTable tr"
    );

setupRow(firstRow);


// =========================
// 按下「＋ 新增材料」
// =========================

addRowButton.addEventListener(
    "click",
    function() {

        addRow();

    }
);


// =========================
// 按下「💾 儲存估價單」
// =========================

saveQuotationButton.addEventListener(
    "click",
    async function() {

        try {

            // 儲存目前估價單
            await saveQuotation();

            // 顯示儲存成功訊息
            alert(
                "估價單儲存成功！"
            );

        }

        catch (error) {

            // 儲存失敗
            alert(
                "估價單儲存失敗，請查看瀏覽器主控台。"
            );

        }

    }
);


// =========================
// 工程名稱修改時
// =========================

projectNameInput.addEventListener(
    "input",
    function() {

        // 儲存工程名稱
        scheduleSaveQuotation();

    }
);


// =========================
// 工程日期修改時
// =========================

projectDateInput.addEventListener(
    "input",
    function() {

        // 儲存工程日期
        scheduleSaveQuotation();

    }
);


// =========================
// 工程地址修改時
// =========================

projectAddressInput.addEventListener(
    "input",
    function() {

        // 儲存工程地址
        scheduleSaveQuotation();

    }
);


// =========================
// 按下「匯出 PDF」
// =========================

printQuotationButton.addEventListener(
    "click",
    function() {

        window.print();

    }
);


// =========================
// 網頁載入時
// 從 Supabase 取得材料資料
// =========================

loadMaterials()
    .then(
        function() {

            // 材料資料取得完成後
            // 再載入目前估價單
            return loadQuotation();

        }
    )
    .then(
        function() {

            // 估價單載入完成後
            // 再次計算總金額
            calculateTotal();

        }
    );


// =========================
// 定期重新取得雲端材料資料
// =========================

// 每 30 秒重新取得一次材料資料
// 讓其他使用者新增材料後
// 目前網頁也能取得最新資料
setInterval(
    function() {

        refreshMaterials();

    },
    30000
);

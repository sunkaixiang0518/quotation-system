
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

                
                // =========================
                // 加入材料
                // =========================

                quotationItems.push({
                    quotation_id: Number(currentQuotationId),
                    material_date: materialDate || null,
                    name: name,
                    spec: spec,
                    quantity: quantity,
                    price: price,
                    amount: amount,
                    remark: remark
                });
            }
        );

        // 更新估價單基本資料
        const quotationResponse = await fetch(
            QUOTATIONS_API + "?id=eq." + encodeURIComponent(currentQuotationId),
            {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify({
                    project_name: projectNameInput.value.trim(),
                    project_date: projectDateInput.value || null,
                    project_address: projectAddressInput.value.trim()
                })
            }
        );

        if (!quotationResponse.ok) {
            throw new Error("更新估價單失敗：" + await quotationResponse.text());
        }

        // 刪除這張估價單舊有的材料明細
        const deleteResponse = await fetch(
            QUOTATION_ITEMS_API + "?quotation_id=eq." + encodeURIComponent(currentQuotationId),
            {
                method: "DELETE",
                headers: getHeaders()
            }
        );

        if (!deleteResponse.ok) {
            throw new Error("刪除舊材料明細失敗：" + await deleteResponse.text());
        }

        // 重新儲存目前畫面上的材料明細
        if (quotationItems.length > 0) {
            const itemsResponse = await fetch(QUOTATION_ITEMS_API, {
                method: "POST",
                headers: {
                    ...getHeaders(),
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify(quotationItems)
            });

            if (!itemsResponse.ok) {
                throw new Error("儲存材料明細失敗：" + await itemsResponse.text());
            }
        }

        alert("估價單已儲存！");
        return true;

    } catch (error) {
        console.error("儲存估價單失敗：", error);
        alert("儲存失敗，請查看瀏覽器主控台的錯誤訊息。");
        return false;

    } finally {
        savingQuotation = false;

        // 如果儲存期間又有新的儲存要求，再執行一次
        if (savePending) {
            savePending = false;
            saveQuotation();
        }
    }
}

// =========================
// 綁定材料列的輸入事件
// =========================

function setupRow(row) {
    const quantityInput = row.querySelector(".quantity");
    const priceInput = row.querySelector(".price");
    const nameInput = row.querySelector(".name");
    const suggestions = row.querySelector(".materialSuggestions");

    // 數量或單價改變時，重新計算金額
    if (quantityInput) {
        quantityInput.addEventListener("input", () => calculateRow(row));
    }

    if (priceInput) {
        priceInput.addEventListener("input", () => calculateRow(row));
    }

    // 輸入品名時，顯示符合的材料建議
    if (nameInput && suggestions) {
        nameInput.addEventListener("input", () => {
            const keyword = nameInput.value.trim().toLowerCase();
            suggestions.innerHTML = "";

            if (!keyword) {
                suggestions.style.display = "none";
                return;
            }

            const matches = materials.filter(material =>
                String(material.name || "").toLowerCase().includes(keyword)
            );

            matches.forEach(material => {
                const option = document.createElement("div");
                option.textContent =
                    material.name + (material.spec ? "（" + material.spec + "）" : "");
                option.style.cursor = "pointer";
                option.style.padding = "6px";

                option.addEventListener("click", () => {
                    nameInput.value = material.name || "";
                    row.querySelector(".spec").value = material.spec || "";
                    row.querySelector(".price").value = material.price ?? "";
                    suggestions.innerHTML = "";
                    suggestions.style.display = "none";
                    calculateRow(row);
                });

                suggestions.appendChild(option);
            });

            suggestions.style.display = matches.length ? "block" : "none";
        });
    }

    // 刪除材料列；至少保留一列供輸入
    const deleteButton = row.querySelector(".deleteRow");
    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            if (materialTable.querySelectorAll("tr").length > 1) {
                row.remove();
            } else {
                row.querySelectorAll("input").forEach(input => input.value = "");
            }
            calculateTotal();
        });
    }
}

// =========================
// 載入目前估價單資料
// =========================

async function loadQuotation() {
    try {
        const quotationResponse = await fetch(
            QUOTATIONS_API + "?id=eq." + encodeURIComponent(currentQuotationId) + "&select=*",
            { method: "GET", headers: getHeaders() }
        );

        if (!quotationResponse.ok) {
            throw new Error(await quotationResponse.text());
        }

        const quotations = await quotationResponse.json();
        if (!quotations.length) {
            throw new Error("找不到這張估價單。");
        }

        const quotation = quotations[0];
        projectNameInput.value = quotation.project_name || "";
        projectDateInput.value = quotation.project_date || getTodayDate();
        projectAddressInput.value = quotation.project_address || "";

        const itemsResponse = await fetch(
            QUOTATION_ITEMS_API + "?quotation_id=eq." +
            encodeURIComponent(currentQuotationId) + "&select=*&order=id.asc",
            { method: "GET", headers: getHeaders() }
        );

        if (!itemsResponse.ok) {
            throw new Error(await itemsResponse.text());
        }

        const items = await itemsResponse.json();

        // 清除原有空白列，再依雲端資料建立材料列
        materialTable.innerHTML = "";

        (items.length ? items : [{}]).forEach(item => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td><input type="date" class="materialDate"></td>
                <td style="position:relative">
                    <input type="text" class="name" autocomplete="off">
                    <div class="materialSuggestions"></div>
                </td>
                <td><input type="text" class="spec"></td>
                <td><input type="number" class="quantity"></td>
                <td><input type="number" class="price"></td>
                <td><input type="number" class="amount" readonly></td>
                <td><input type="text" class="remark"></td>
                <td class="operation-column"><button type="button" class="deleteRow">刪除</button></td>
            `;

            row.querySelector(".materialDate").value = item.material_date || "";
            row.querySelector(".name").value = item.name || "";
            row.querySelector(".spec").value = item.spec || "";
            row.querySelector(".quantity").value = item.quantity ?? "";
            row.querySelector(".price").value = item.price ?? "";
            row.querySelector(".remark").value = item.remark || "";

            materialTable.appendChild(row);
            setupRow(row);
            calculateRow(row);
        });

        calculateTotal();

    } catch (error) {
        console.error("載入估價單失敗：", error);
        alert("載入估價單失敗，請查看瀏覽器主控台。");
    }
}

// =========================
// 新增材料列
// =========================

if (addRowButton) {
    addRowButton.addEventListener("click", () => {
        const firstRow = materialTable.querySelector("tr");
        if (!firstRow) return;

        const newRow = firstRow.cloneNode(true);
        newRow.querySelectorAll("input").forEach(input => input.value = "");

        const suggestions = newRow.querySelector(".materialSuggestions");
        if (suggestions) {
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
        }

        materialTable.appendChild(newRow);
        setupRow(newRow);
        calculateTotal();
    });
}

// =========================
// 儲存估價單按鈕
// =========================

if (saveQuotationButton) {
    saveQuotationButton.addEventListener("click", () => {
        saveQuotation();
    });
}

// =========================
// 匯出 PDF 按鈕
// =========================

if (printQuotationButton) {
    printQuotationButton.addEventListener("click", () => {
        window.print();
    });
}

// =========================
// 啟動程式
// =========================

async function initializeQuotation() {
    if (!currentQuotationId) return;

    await loadMaterials();
    await loadQuotation();
}

initializeQuotation();


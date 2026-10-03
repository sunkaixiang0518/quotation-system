```javascript
// =========================
// 從材料資料庫取得材料資料
// =========================

let materials = JSON.parse(
    localStorage.getItem("materials")
) || [];


// =========================
// 重新取得最新材料資料
// =========================

function loadMaterials() {

    materials = JSON.parse(
        localStorage.getItem("materials")
    ) || [];

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
// 建立目前估價單專用的儲存名稱
// =========================

// 每一張估價單都有自己的 localStorage 名稱
const quotationStorageKey =
    "quotation_" +
    currentQuotationId;


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

        const amount =
            Number(
                row.querySelector(".amount").value
            ) || 0;

        total += amount;

    });

    document.querySelector(
        "#totalAmount"
    ).textContent = total;

}


// =========================
// 儲存估價單
// =========================

function saveQuotation() {

    const rows =
        document.querySelectorAll(
            "#materialTable tr"
        );

    const quotation = [];


    // =========================
    // 儲存每一筆材料
    // =========================

    rows.forEach(function(row) {

        quotation.push({

            // 儲存品名
            name:
                row.querySelector(".name").value,

            // 儲存規格
            spec:
                row.querySelector(".spec").value,

            // 儲存數量
            quantity:
                row.querySelector(".quantity").value,

            // 儲存單價
            price:
                row.querySelector(".price").value,

            // 儲存金額
            amount:
                row.querySelector(".amount").value,

            // 儲存備註
            remark:
                row.querySelector(".remark").value

        });

    });


    // =========================
    // 建立完整的估價單資料
    // =========================

    const quotationData = {

        // 儲存工程名稱
        projectName:
            projectNameInput.value,

        // 儲存工程日期
        projectDate:
            projectDateInput.value,

        // 儲存工程地址
projectAddress:
    projectAddressInput.value,

        // 儲存材料資料
        materials:
            quotation

    };


    // =========================
    // 儲存到目前估價單自己的位置
    // =========================

    localStorage.setItem(
        quotationStorageKey,
        JSON.stringify(quotationData)
    );

}


// =========================
// 設定一列材料的功能
// =========================

function setupRow(row) {

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

            // 每次輸入時取得最新材料資料
            loadMaterials();

            // 取得輸入的文字
            const keyword =
                nameInput.value.trim();

            // 清空舊的搜尋結果
            suggestionBox.innerHTML = "";

            // 如果沒有輸入文字
            if (keyword === "") {

                return;

            }


            // =========================
            // 找出可能的材料
            // =========================

            const results =
                materials.filter(
                    function(item) {

                        return item.name.includes(
                            keyword
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
                                item.spec;

                            // 填入單價
                            priceInput.value =
                                item.price;

                            // 清除搜尋結果
                            suggestionBox.innerHTML =
                                "";

                            // 計算金額
                            calculateRow(row);

                            // 儲存估價單
                            saveQuotation();

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
                    material.spec;

                // 自動帶出單價
                priceInput.value =
                    material.price;

                // 計算金額
                calculateRow(row);

            }


            // 儲存估價單
            saveQuotation();

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
            saveQuotation();

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
            saveQuotation();

        }
    );


    // =========================
    // 修改規格
    // =========================

    specInput.addEventListener(
        "input",
        function() {

            // 儲存估價單
            saveQuotation();

        }
    );


    // =========================
    // 修改備註
    // =========================

    remarkInput.addEventListener(
        "input",
        function() {

            // 儲存估價單
            saveQuotation();

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


    // 儲存估價單
    saveQuotation();

}


// =========================
// 載入之前儲存的估價單
// =========================

function loadQuotation() {

    const savedData =
        JSON.parse(
            localStorage.getItem(
                quotationStorageKey
            )
        );


    // 如果沒有儲存過估價單
    if (!savedData) {

        return;

    }


    // =========================
    // 恢復工程名稱
    // =========================

    projectNameInput.value =
        savedData.projectName || "";


    // =========================
    // 恢復工程日期
    // =========================

    projectDateInput.value =
        savedData.projectDate || "";

    // =========================
// 恢復工程地址
// =========================

projectAddressInput.value =
    savedData.projectAddress || "";


    // =========================
    // 取得材料資料
    // =========================

    const quotation =
        savedData.materials || [];


    // 如果沒有材料
    if (quotation.length === 0) {

        return;

    }


    // =========================
    // 使用第一列放第一筆資料
    // =========================

    const firstRow =
        document.querySelector(
            "#materialTable tr"
        );


    if (firstRow) {

        firstRow.querySelector(".name").value =
            quotation[0].name || "";

        firstRow.querySelector(".spec").value =
            quotation[0].spec || "";

        firstRow.querySelector(".quantity").value =
            quotation[0].quantity || "";

        firstRow.querySelector(".price").value =
            quotation[0].price || "";

        firstRow.querySelector(".remark").value =
            quotation[0].remark || "";

        calculateRow(firstRow);

    }


    // =========================
    // 建立剩下的材料列
    // =========================

    for (
        let i = 1;
        i < quotation.length;
        i++
    ) {

        // 新增一列
        addRow();

        // 取得最後一列
        const rows =
            document.querySelectorAll(
                "#materialTable tr"
            );

        const row =
            rows[rows.length - 1];


        // 恢復資料
        row.querySelector(".name").value =
            quotation[i].name || "";

        row.querySelector(".spec").value =
            quotation[i].spec || "";

        row.querySelector(".quantity").value =
            quotation[i].quantity || "";

        row.querySelector(".price").value =
            quotation[i].price || "";

        row.querySelector(".remark").value =
            quotation[i].remark || "";


        // 重新計算金額
        calculateRow(row);

    }

}


// =========================
// 材料資料庫更新時
// 自動更新估價單價格
// =========================

window.addEventListener(
    "storage",
    function(event) {

        // 確認更新的是材料資料
        if (event.key !== "materials") {

            return;

        }

        // 重新取得最新材料
        loadMaterials();


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
            if (nameInput.value === "") {

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
        saveQuotation();

    }
);


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
    function() {

        // 儲存目前估價單
        saveQuotation();

        // 顯示儲存成功訊息
        alert("估價單儲存成功！");

    }
);


// =========================
// 工程名稱修改時
// =======
```

// =========================
// 從 localStorage 取得材料資料
// =========================

let materials = JSON.parse(
    localStorage.getItem("materials")
) || [];


// =========================
// 取得 HTML 元素
// =========================

// 材料名稱輸入框
const materialNameInput =
    document.getElementById("materialName");

// 材料規格輸入框
const materialSpecInput =
    document.getElementById("materialSpec");

// 材料單價輸入框
const materialPriceInput =
    document.getElementById("materialPrice");

// 儲存材料按鈕
const saveMaterialButton =
    document.getElementById("saveMaterial");

// 材料列表
const materialTable =
    document.getElementById("materialTable");


// =========================
// 目前正在編輯的材料
// =========================

// -1 代表目前不是編輯狀態
let editingIndex = -1;


// =========================
// 顯示所有材料
// =========================

function displayMaterials() {

    // 先清空原本的材料列表
    materialTable.innerHTML = "";


    // 一個一個讀取材料
    materials.forEach(function(item, index) {

        // 建立一列
        const row = document.createElement("tr");


        // 建立這一列的內容
        row.innerHTML = `

            <td>
                ${item.name}
            </td>

            <td>
                ${item.spec}
            </td>

            <td>
                $${item.price}
            </td>

            <td>

                <button
                    class="editMaterial"
                    data-index="${index}"
                >
                    編輯
                </button>

                <button
                    class="deleteMaterial"
                    data-index="${index}"
                >
                    刪除
                </button>

            </td>

        `;


        // 把這一列加入材料列表
        materialTable.appendChild(row);

    });


    // 設定編輯按鈕
    setupEditButtons();


    // 設定刪除按鈕
    setupDeleteButtons();

}


// =========================
// 設定編輯按鈕
// =========================

function setupEditButtons() {

    // 找到所有編輯按鈕
    const editButtons =
        document.querySelectorAll(".editMaterial");


    // 一個一個設定
    editButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            // 取得這個材料的位置
            const index =
                Number(button.dataset.index);


            // 取得要編輯的材料
            const material =
                materials[index];


            // 把材料資料放回輸入框
            materialNameInput.value =
                material.name;

            materialSpecInput.value =
                material.spec;

            materialPriceInput.value =
                material.price;


            // 記住目前正在編輯哪一筆材料
            editingIndex = index;


            // 修改按鈕文字
            saveMaterialButton.textContent =
                "儲存修改";

        });

    });

}


// =========================
// 設定刪除按鈕
// =========================

function setupDeleteButtons() {

    // 找到所有刪除按鈕
    const deleteButtons =
        document.querySelectorAll(".deleteMaterial");


    // 一個一個設定
    deleteButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            // 取得這個材料的位置
            const index =
                Number(button.dataset.index);


            // 確認是否真的要刪除
            const confirmDelete =
                confirm("確定要刪除這個材料嗎？");


            // 如果按取消
            if (!confirmDelete) {

                return;

            }


            // 從材料陣列刪除
            materials.splice(index, 1);


            // 更新 localStorage
            localStorage.setItem(
                "materials",
                JSON.stringify(materials)
            );


            // 重新顯示材料
            displayMaterials();

        });

    });

}


// =========================
// 儲存材料
// =========================

saveMaterialButton.addEventListener(
    "click",
    function() {

        // 取得材料名稱
        const name =
            materialNameInput.value.trim();


        // 取得材料規格
        const spec =
            materialSpecInput.value.trim();


        // 取得材料單價
        const price =
            Number(materialPriceInput.value);


        // =========================
        // 檢查材料名稱
        // =========================

        if (name === "") {

            alert("請輸入材料名稱");

            return;

        }


        // =========================
        // 檢查材料單價
        // =========================

        if (price <= 0) {

            alert("請輸入正確的單價");

            return;

        }


        // =========================
        // 編輯材料
        // =========================

        if (editingIndex !== -1) {

            // 修改原本的材料
            materials[editingIndex] = {

                name: name,

                spec: spec,

                price: price

            };


            // 儲存修改後的資料
            localStorage.setItem(
                "materials",
                JSON.stringify(materials)
            );


            // 清空輸入框
            materialNameInput.value = "";

            materialSpecInput.value = "";

            materialPriceInput.value = "";


            // 結束編輯狀態
            editingIndex = -1;


            // 恢復按鈕文字
            saveMaterialButton.textContent =
                "儲存材料";


            // 更新材料列表
            displayMaterials();


            alert("材料修改成功！");

            return;

        }


        // =========================
        // 建立新材料
        // =========================

        const material = {

            name: name,

            spec: spec,

            price: price

        };


        // =========================
        // 加入材料
        // =========================

        materials.push(material);


        // =========================
        // 儲存到 localStorage
        // =========================

        localStorage.setItem(
            "materials",
            JSON.stringify(materials)
        );


        // =========================
        // 清空輸入框
        // =========================

        materialNameInput.value = "";

        materialSpecInput.value = "";

        materialPriceInput.value = "";


        // =========================
        // 更新材料列表
        // =========================

        displayMaterials();


        // 顯示成功訊息
        alert("材料儲存成功！");

    }
);


// =========================
// 網頁載入時
// 顯示目前所有材料
// =========================

displayMaterials();
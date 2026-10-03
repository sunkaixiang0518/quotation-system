```javascript
// =========================
// Supabase 雲端資料庫設定
// =========================

// Supabase 專案網址
const SUPABASE_URL =
    "https://ilplovmomqblgqopihce.supabase.co";

// Supabase anon API Key
// 請把你自己的 anon key 貼在下面的引號裡
const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscGxvdm1vbXFibGdxb3BpaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzMxMjEsImV4cCI6MjEwNjYwOTEyMX0.GzszzXgUmF_Jq2dDH9QI61zUGuiy968ufzZM3H2qGoU";

// =========================
// Supabase API 網址
// =========================

// materials 資料表的 API 網址
const MATERIALS_API =
    SUPABASE_URL +
    "/rest/v1/materials";

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
let editingId = null;

// =========================
// Supabase Request Headers
// =========================

// 建立 Supabase API 要使用的標頭
function getHeaders() {

    return {

        // API Key
        "apikey": SUPABASE_KEY,

        // Authorization
        "Authorization":
            "Bearer " + SUPABASE_KEY,

        // 告訴 Supabase 我們傳送的是 JSON
        "Content-Type":
            "application/json"

    };

}

// =========================
// 從 Supabase 取得所有材料
// =========================

async function loadMaterials() {

    try {

        // 向 Supabase 要求材料資料
        const response =
            await fetch(
                MATERIALS_API +
                "?select=*&order=id.asc",
                {

                    method: "GET",

                    headers:
                        getHeaders()

                }
            );

        // 如果取得資料失敗
        if (!response.ok) {

            throw new Error(
                "無法取得材料資料"
            );

        }

        // 將資料轉成 JavaScript
        const materials =
            await response.json();

        // 顯示材料
        displayMaterials(
            materials
        );

    }

    catch (error) {

        // 顯示錯誤
        console.error(
            "取得材料失敗：",
            error
        );

        alert(
            "無法取得雲端材料資料，請檢查 Supabase 設定。"
        );

    }

}

// =========================
// 顯示所有材料
// =========================

function displayMaterials(
    materials
) {

    // 先清空原本的材料列表
    materialTable.innerHTML = "";

    // 一個一個讀取材料
    materials.forEach(
        function(item) {

            // 建立一列
            const row =
                document.createElement(
                    "tr"
                );

            // 建立這一列的內容
            row.innerHTML = `

                <td>
                    ${item.name}
                </td>

                <td>
                    ${item.spec || ""}
                </td>

                <td>
                    $${item.price}
                </td>

                <td>

                    <button
                        class="editMaterial"
                        data-id="${item.id}"
                    >
                        編輯
                    </button>

                    <button
                        class="deleteMaterial"
                        data-id="${item.id}"
                    >
                        刪除
                    </button>

                </td>

            `;

            // 把這一列加入材料列表
            materialTable.appendChild(
                row
            );

        }
    );

    // 設定編輯按鈕
    setupEditButtons();

    // 設定刪除按鈕
    setupDeleteButtons();

}

// =========================
// 設

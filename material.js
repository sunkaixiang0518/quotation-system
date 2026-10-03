// =========================
// Supabase 雲端資料庫設定
// =========================

// Supabase 專案網址
const SUPABASE_URL =
    "https://ilplovmomqblgqopihce.supabase.co";

// Supabase anon public key
// 請把你自己的 anon public key 貼在下面的引號裡
const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscGxvdm1vbXFibGdxb3BpaGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzMxMjEsImV4cCI6MjEwNjYwOTEyMX0.GzszzXgUmF_Jq2dDH9QI61zUGuiy968ufzZM3H2qGoU";

// =========================
// Supabase API 網址
// =========================

// materials 資料表的 API 網址
const MATERIALS_API =
    SUPABASE_URL + "/rest/v1/materials";

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

// null 代表目前不是編輯狀態
let editingId = null;

// =========================
// 建立 Supabase Request Headers
// =========================

function getHeaders() {

    return {
        "apikey": SUPABASE_KEY,

        "Authorization":
            "Bearer " + SUPABASE_KEY,

        "Content-Type":
            "application/json"
    };

}

// =========================
// 從 Supabase 取得所有材料
// =========================

async function loadMaterials() {

    try {

        // 向 Supabase 取得材料資料
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
                "Supabase 取得資料錯誤：",
                errorText
            );

            throw new Error(
                errorText
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

        console.error(
            "取得材料失敗：",
            error
        );

        alert(
            "無法取得雲端材料資料，請查看 F12 Console。"
        );

    }

}

// =========================
// 顯示所有材料
// =========================

function displayMaterials(
    materials
) {

    // 清空材料列表
    materialTable.innerHTML = "";

    // 一個一個顯示材料
    materials.forEach(
        function(item) {

            // 建立一列
            const row =
                document.createElement("tr");

            // 建立這一列的內容
            row.innerHTML =

                "<td>" +
                item.name +
                "</td>" +

                "<td>" +
                (item.spec || "") +
                "</td>" +

                "<td>$" +
                item.price +
                "</td>" +

                "<td>" +

                "<button " +
                "class='editMaterial' " +
                "data-id='" +
                item.id +
                "'>" +
                "編輯" +
                "</button> " +

                "<button " +
                "class='deleteMaterial' " +
                "data-id='" +
                item.id +
                "'>" +
                "刪除" +
                "</button>" +

                "</td>";

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
// 設定編輯按鈕
// =========================

function setupEditButtons() {

    // 找到所有編輯按鈕
    const editButtons =
        document.querySelectorAll(
            ".editMaterial"
        );

    // 一個一個設定
    editButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function() {

                    // 取得材料 ID
                    const id =
                        Number(
                            button.dataset.id
                        );

                    try {

                        // 從 Supabase 取得這筆材料
                        const response =
                            await fetch(
                                MATERIALS_API +
                                "?id=eq." +
                                id +
                                "&select=*",
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
                                "Supabase 錯誤：",
                                errorText
                            );

                            throw new Error(
                                errorText
                            );

                        }

                        // 取得資料
                        const data =
                            await response.json();

                        // 如果找不到
                        if (
                            data.length === 0
                        ) {

                            alert(
                                "找不到這筆材料"
                            );

                            return;

                        }

                        // 取得材料
                        const material =
                            data[0];

                        // 放回輸入框
                        materialNameInput.value =
                            material.name;

                        materialSpecInput.value =
                            material.spec || "";

                        materialPriceInput.value =
                            material.price;

                        // 記住目前正在編輯的 ID
                        editingId =
                            material.id;

                        // 修改按鈕文字
                        saveMaterialButton.textContent =
                            "儲存修改";

                    }

                    catch (error) {

                        console.error(
                            "取得材料失敗：",
                            error
                        );

                        alert(
                            "無法取得這筆材料。"
                        );

                    }

                }
            );

        }
    );

}

// =========================
// 設定刪除按鈕
// =========================

function setupDeleteButtons() {

    // 找到所有刪除按鈕
    const deleteButtons =
        document.querySelectorAll(
            ".deleteMaterial"
        );

    // 一個一個設定
    deleteButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                async function() {

                    // 取得材料 ID
                    const id =
                        Number(
                            button.dataset.id
                        );

                    // 確認是否刪除
                    const confirmDelete =
                        confirm(
                            "確定要刪除這個材料嗎？"
                        );

                    // 使用者取消
                    if (!confirmDelete) {

                        return;

                    }

                    try {

                        // 從 Supabase 刪除
                        const response =
                            await fetch(
                                MATERIALS_API +
                                "?id=eq." +
                                id,
                                {
                                    method: "DELETE",
                                    headers: getHeaders()
                                }
                            );

                        // 如果刪除失敗
                        if (!response.ok) {

                            const errorText =
                                await response.text();

                            console.error(
                                "Supabase 刪除錯誤：",
                                errorText
                            );

                            throw new Error(
                                errorText
                            );

                        }

                        // 重新取得材料
                        await loadMaterials();

                        alert(
                            "材料刪除成功！"
                        );

                    }

                    catch (error) {

                        console.error(
                            "刪除材料失敗：",
                            error
                        );

                        alert(
                            "材料刪除失敗，請查看 F12 Console。"
                        );

                    }

                }
            );

        }
    );

}

// =========================
// 儲存材料
// =========================

saveMaterialButton.addEventListener(
    "click",
    async function() {

        // 取得材料名稱
        const name =
            materialNameInput.value.trim();

        // 取得材料規格
        const spec =
            materialSpecInput.value.trim();

        // 取得材料單價
        const price =
            Number(
                materialPriceInput.value
            );

        // =========================
        // 檢查材料名稱
        // =========================

        if (name === "") {

            alert(
                "請輸入材料名稱"
            );

            return;

        }

        // =========================
        // 檢查材料單價
        // =========================

        if (
            Number.isNaN(price) ||
            price <= 0
        ) {

            alert(
                "請輸入正確的單價"
            );

            return;

        }

        // =========================
        // 編輯材料
        // =========================

        if (editingId !== null) {

            try {

                // 要更新的材料
                const material = {

                    name: name,

                    spec: spec,

                    price: price

                };

                // 建立 Request Headers
                const headers =
                    getHeaders();

                // 告訴 Supabase 修改後回傳資料
                headers["Prefer"] =
                    "return=representation";

                // 傳送修改
                const response =
                    await fetch(
                        MATERIALS_API +
                        "?id=eq." +
                        editingId,
                        {
                            method: "PATCH",
                            headers: headers,
                            body:
                                JSON.stringify(
                                    material
                                )
                        }
                    );

                // 如果修改失敗
                if (!response.ok) {

                    const errorText =
                        await response.text();

                    console.error(
                        "Supabase 修改錯誤：",
                        errorText
                    );

                    throw new Error(
                        errorText
                    );

                }

                // 清空輸入框
                materialNameInput.value =
                    "";

                materialSpecInput.value =
                    "";

                materialPriceInput.value =
                    "";

                // 結束編輯狀態
                editingId =
                    null;

                // 恢復按鈕文字
                saveMaterialButton.textContent =
                    "儲存材料";

                // 重新取得材料
                await loadMaterials();

                alert(
                    "材料修改成功！"
                );

            }

            catch (error) {

                console.error(
                    "修改材料失敗：",
                    error
                );

                alert(
                    "材料修改失敗，請查看 F12 Console。"
                );

            }

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
        // 加入 Supabase
        // =========================

        try {

            // 建立 Request Headers
            const headers =
                getHeaders();

            // 告訴 Supabase 新增後回傳資料
            headers["Prefer"] =
                "return=representation";

            // 傳送新材料
            const response =
                await fetch(
                    MATERIALS_API,
                    {
                        method: "POST",
                        headers: headers,
                        body:
                            JSON.stringify(
                                material
                            )
                    }
                );

            // 如果新增失敗
            if (!response.ok) {

                const errorText =
                    await response.text();

                console.error(
                    "Supabase 新增錯誤：",
                    errorText
                );

                throw new Error(
                    errorText
                );

            }

            // 清空輸入框
            materialNameInput.value =
                "";

            materialSpecInput.value =
                "";

            materialPriceInput.value =
                "";

            // 重新取得材料
            await loadMaterials();

            // 顯示成功訊息
            alert(
                "材料儲存成功！"
            );

        }

        catch (error) {

            console.error(
                "新增材料失敗：",
                error
            );

            alert(
                "材料新增失敗，請查看 F12 Console。"
            );

        }

    }
);

// =========================
// 網頁載入時
// =========================

// 從 Supabase 取得材料
loadMaterials();

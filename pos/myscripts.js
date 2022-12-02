var cartItems = [];
var categorySelected;

var masterBarcodeProductMap = {};
var masterProducts = [];
var masterProductGroups = [];
var successToast;
var errorToast;
var warningToast;
/*
if ("serviceWorker" in navigator) {
  // register service worker
  navigator.serviceWorker.register("service-worker.js");
}*/



function submitOrder() {
  let customerName = document.getElementById("customerName").value;
  if (!(cartItems && cartItems.length > 0)) {
    document.getElementById("errorToast_message").innerHTML = "Cart should have items added !";
    errorToast.show();
  }
  else {
    const XHR = new XMLHttpRequest();

    // Define what happens on successful data submission
    XHR.addEventListener('load', (event) => {
      document.getElementById("successToast_message").innerHTML = this.responseText;
      successToast.show();
      clearCart();
    });

    // Define what happens in case of error
    XHR.addEventListener('error', (event) => {
      document.getElementById("errorToast_message").innerHTML = "Failed to Save Order";
      errorToast.show();
    });


    // Set up our request
    XHR.open('POST', '/alnadir/pos_save.php');
    XHR.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

    // Send our FormData object; HTTP headers are set automatically
    XHR.send(JSON.stringify({
      "products": cartItems,
      "customer": customerName
    }));
  }
}


function saveOrderAsDraft() {
  let customerName = document.getElementById("customerName").value;
  if (!customerName) {
    document.getElementById("errorToast_message").innerHTML = "Customer Name is required !";
    errorToast.show();
  }
  else if (!(cartItems && cartItems.length > 0)) {
    document.getElementById("errorToast_message").innerHTML = "Cart should have items added !";
    errorToast.show();
  }
  else {
    const XHR = new XMLHttpRequest();

    // Define what happens on successful data submission
    XHR.addEventListener('load', (event) => {
      document.getElementById("successToast_message").innerHTML = this.responseText;
      successToast.show();
    });

    // Define what happens in case of error
    XHR.addEventListener('error', (event) => {
      document.getElementById("errorToast_message").innerHTML = "Failed to Save Temporary Order";
      errorToast.show();
    });


    // Set up our request
    XHR.open('POST', '/alnadir/pos_temporary_save.php');
    XHR.setRequestHeader('Content-type', 'application/json;charset=UTF-8');

    // Send our FormData object; HTTP headers are set automatically
    XHR.send(JSON.stringify({
      "products": cartItems,
      "customer": customerName
    }));
  }
}


function onLoadWrapper() {
  successToast = new bootstrap.Toast(document.getElementById("successToast"));
  errorToast = new bootstrap.Toast(document.getElementById("errorToast"));
  warningToast = new bootstrap.Toast(document.getElementById("warningToast"));
  var myModal = document.getElementById('exampleModalPayment')
  var myInput = document.getElementById('payment_type')
  myModal.addEventListener('shown.bs.modal', function () {
    myInput.focus()
  })
  document.getElementById("barcode").focus();
  populateProductGroups();
  populateBarcodeProductMap();
  document.getElementById("temp_order_count").innerHTML = 0;
}

function populateProductGroups() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var response = JSON.parse(this.responseText);
      masterProductGroups = response.categories;
      showProductGroups();
    }
  };
  //TODO - change URL /alnadir2/pos/get_product_category.php
  xhttp.open("GET", "./data/category.json", true);
  xhttp.send();
}

function showProductGroups() {
  var prodGroupHtml = "<div class='productGroupButton'><input onclick='showProducts(this)' type='radio' class='btn-check  product_group_btn' name='btnradio' id='ALL' autocomplete='off' checked><label style='width:100%;height:100%;' class='btn btn-dark' for='ALL'>All</label></div>";
  masterProductGroups.forEach(productGroup => {
    prodGroupHtml += "<div class='productGroupButton'><input onclick='showProducts(this)' type='radio' class='btn-check product_group_btn' name='btnradio' id='" + productGroup.category_id + "' autocomplete='off'><label style='width:100%;height:100%;' class='btn btn-dark' for='" + productGroup.category_id + "'>" + productGroup.category_name + "</label></div>";
  });
  document.getElementById("category_section").innerHTML = prodGroupHtml;
}


function populateBarcodeProductMap() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var response = JSON.parse(this.responseText);
      masterProducts = response.products;
      masterBarcodeProductMap = {};
      masterProducts.forEach(product => {
        product.barcodes.forEach(barcode => {
          barcode.item_id = product.item_id;
          if (masterBarcodeProductMap[barcode["barcode"]]) {
            masterBarcodeProductMap[barcode["barcode"]].push(barcode);
          }
          else {
            masterBarcodeProductMap[barcode["barcode"]] = [barcode];
          }
        });
      });
      showProducts({ "id": "ALL" });
      showCartItems();
    }
  };
  //TODO - change URL /alnadir2/pos/get_products.php
  xhttp.open("GET", "./data/product.json", true);
  xhttp.send();
}

function resetSearchString(){
  document.getElementById("keyword_search").value = "";
  searchProducts(this);
}

function showProducts(productGroup) {
  categorySelected = productGroup.id;
  let filteredProducts;
  if (productGroup.id != "ALL") {
    filteredProducts = masterProducts.filter(checkProdutGroup, productGroup);
  }
  else {
    filteredProducts = masterProducts;
  }
  let tempProducts = filteredProducts;
  let searchTxt = document.getElementById("keyword_search").value;
  if (searchTxt) {
    filteredProducts = tempProducts.filter(checkSearchTxt, searchTxt);
  }
  let mastreDiv = document.createElement('div');
  mastreDiv.className = "row cl_no_margin";
  filteredProducts.forEach(produt => {
    let div1 = document.createElement('div');
    div1.className = "col-sm-6 col-md-4 col-lg-3";
    div1.onclick = addToCart.bind(produt);

    let div2 = document.createElement('div');
    div2.className = "cust_card";

    let p0 = document.createElement('p');
    p0.className = "badge qty-bagde"
    p0.innerHTML = "Qty : "+(produt?(produt.barcodes[0]?produt.barcodes[0].stk_qty:0):0);
    div2.appendChild(p0);

    let img1 = document.createElement('img');
    img1.src = produt.image;
    div2.appendChild(img1);

    let p1 = document.createElement('p');
    p1.className = "cl-product-name"
    p1.innerHTML = produt.item_name;
    div2.appendChild(p1);

    let p2 = document.createElement('p');
    p2.className = "cl-product-details"
    p2.innerHTML = "&#8377;" + produt.unit_rate;
    div2.appendChild(p2);
    div1.appendChild(div2);
    mastreDiv.appendChild(div1);
  });
  document.getElementById("products_section").replaceChildren(mastreDiv);
}


function checkProdutGroup(prod, ind, array) {
  return prod.category_id == this.id;
}

function checkSearchTxt(prod, ind, array) {
  return prod.item_name.toLowerCase().match(this.toLowerCase());
}

function checkBarcode(prod, ind, array) {
  return prod.barcodes.includes(this.toString());
}

function filterByItemId(product) {
  return product.item_id == this;
}

function searchWithBarcode() {
  var searchElem = document.getElementById("barcode");
  if (searchElem && searchElem.value) {
    let filteredProducts = masterBarcodeProductMap[searchElem.value];
    if (filteredProducts && filteredProducts.length == 1) {
      let prodCode = { ...filteredProducts[0] };
      let product = masterProducts.filter(filterByItemId, prodCode.item_id);
      let tempProduct = { ...product[0] };
      tempProduct.prodCode = prodCode;
      tempProduct.barcode = prodCode.barcode;
      addToCart(tempProduct);
      document.getElementById('barcode').value = "";
      document.getElementById('barcode').focus();
    }
    else if (filteredProducts && filteredProducts.length > 1) {
      let form = document.createElement("form");

      let headerDiv = document.createElement("div");
      headerDiv.className = "duplicate_prod_row row mb-1";
      headerDiv.setAttribute("data-bs-dismiss", "modal");

      let headerDiv_1 = document.createElement("div");
      headerDiv_1.className = "col-sm-2";
      headerDiv_1.innerHTML = "Image";

      let headerDiv_2 = document.createElement("div");
      headerDiv_2.className = "col-sm-8";
      headerDiv_2.innerHTML = "Name";

      let headerDiv_3 = document.createElement("div");
      headerDiv_3.className = "col-sm-2";
      headerDiv_3.innerHTML = "Unit Price";

      headerDiv.appendChild(headerDiv_1);
      headerDiv.appendChild(headerDiv_2);
      headerDiv.appendChild(headerDiv_3);
      form.appendChild(headerDiv);

      filteredProducts.forEach(prodCode => {
        let product = masterProducts.filter(filterByItemId, prodCode.item_id);
        let tempProduct = { ...product[0] };
        let tempProductCode = { ...prodCode };
        tempProduct["prodCode"] = tempProductCode;
        tempProduct.barcode = tempProductCode.barcode;
        let div1 = document.createElement("div");
        div1.className = "duplicate_prod_row row mb-1";
        div1.onclick = addToCart.bind(tempProduct);
        div1.setAttribute("data-bs-dismiss", "modal");

        let div1_1 = document.createElement("div");
        div1_1.className = "col-sm-2";
        let img = document.createElement("img");
        img.setAttribute("height", "64px");
        img.setAttribute("width", "64px");
        img.src = tempProduct.image;
        div1_1.appendChild(img);

        let div1_2 = document.createElement("div");
        div1_2.className = "col-sm-8";
        div1_2.innerHTML = tempProduct.item_name;

        let div1_3 = document.createElement("div");
        div1_3.className = "col-sm-2";
        div1_3.innerHTML = tempProductCode.brd_unit_rate;

        div1.appendChild(div1_1);
        div1.appendChild(div1_2);
        div1.appendChild(div1_3);
        form.appendChild(div1);
      });
      document.getElementById('barcode').value = "";
      document.getElementById("barcode_duplicate_modal_body").replaceChildren(form);
      let myModal = new bootstrap.Modal(document.getElementById('barcode_duplicate_modal'), {
        keyboard: false
      });
      myModal.toggle();
    }
  }
}


function applyDiscount(elem) {
  let grandTotalTxt = document.getElementById("total_amount").innerHTML;
  let grandTotal = parseFloat(grandTotalTxt ? grandTotalTxt : 0);
  grandTotal = grandTotal - parseFloat(elem.value ? elem.value : 0);
  document.getElementById("grand_total_amount").innerHTML = (Math.round((grandTotal) * 100) / 100).toFixed(2);
}

function searchProducts(val) {
  if (categorySelected) {
    showProducts({ "id": categorySelected });
  }
  else {
    showProducts({ "id": "ALL" });
  }
}

function clearCart(hideMessage) {
  cartItems = [];
  document.getElementById("discount_amount").value = 0;
  document.getElementById("customerName").value = "";
  document.getElementById("customerMobileNumber").value = "";
  document.getElementById("payment_type").value = "CASH";
  document.getElementById("summary_paid_amount").value = 0;
  document.getElementById("summary_balance_amount").innerHTML = "";
  showCartItems();
  if(!hideMessage){
    document.getElementById("barcode").focus();
    document.getElementById("successToast_message").innerHTML = "Cleared Cart!!";
    successToast.show();
  }
}

function calculateBalance(elem) {
  let grandTotal = document.getElementById("summary_grand_total").innerHTML;
  grandTotal = parseFloat(grandTotal ? grandTotal : 0);
  let paidAmount = document.getElementById("summary_paid_amount").value;
  paidAmount = parseFloat(paidAmount ? paidAmount : 0);
  document.getElementById("summary_balance_amount").innerHTML = (Math.round((paidAmount - grandTotal) * 100) / 100).toFixed(2);
}

function setPaymentSummary() {
  let grandTotal = document.getElementById("grand_total_amount").innerHTML;
  grandTotal = parseFloat(grandTotal ? grandTotal : 0);
  document.getElementById("summary_grand_total").innerHTML = (Math.round((grandTotal) * 100) / 100).toFixed(2);
  let myModal = new bootstrap.Modal(document.getElementById('exampleModalPayment'), {
    keyboard: false
  });
  myModal.toggle();
}

function checkDuplicateCartItem(item) {
  return (item.item_id === this.item_id && item.barcode === this.barcode);
}

function addToCart(prod) {
  let product;
  if (prod && prod.item_id) {
    product = { ...prod };
  }
  else {
    product = { ...this };
  }
  if (!cartItems.find(checkDuplicateCartItem, product)) {
    let finalProduct = { ...product };
    let finalProdCode = finalProduct.prodCode;
    if (finalProdCode) {
      finalProduct.unit_rate = finalProdCode.brd_unit_rate;
      finalProduct.barcode = finalProdCode.barcode;
    }
    finalProduct.quantity = 1;
    cartItems.push(finalProduct)
  }
  showCartItems();
  document.getElementById('barcode').focus();
}

function addTempOrderToCart() {
  let order = this;
  let products = order.products;
  clearCart(true);
  document.getElementById("customerName").value = order.customer;
  products.forEach(product => {
    if (!cartItems.find(checkDuplicateCartItem, product)) {
      let finalProduct = { ...product };
      let finalProdCode = finalProduct.prodCode;
      if (finalProdCode) {
        finalProduct.unit_rate = finalProdCode.brd_unit_rate;
        finalProduct.barcode = finalProdCode.barcode;
      }
      finalProduct.quantity = 1;
      cartItems.push(finalProduct)
    }
  });
  showCartItems();
  document.getElementById('barcode').focus();
  deleteTempOrder(order.customer);
}

function deleteTempOrder(customerName){
  const XHR = new XMLHttpRequest();
  const formData = new FormData();
  formData.append("temp", customerName);

  // Define what happens on successful data submission
  XHR.addEventListener('load', (event) => {
    document.getElementById("successToast_message").innerHTML = "Loaded TempOrder to Cart.";
    successToast.show();
  });

  // Define what happens in case of error
  XHR.addEventListener('error', (event) => {
    document.getElementById("errorToast_message").innerHTML = "Failed to Delete Temporary Order";
    errorToast.show();
  });


  // Set up our request
  XHR.open('POST', 'http://www.agnisolutions.com/alnadir/pos_temporary_delete.php');
  XHR.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  // Send our FormData object; HTTP headers are set automatically
  XHR.send(formData);
}

function quantityChangeTrigger() {
  let id = this.id;
  let qty = parseFloat(document.getElementById(id).value);
  let index = id.substring(9,);
  let updCartItem = cartItems[index];
  updCartItem.quantity = qty;
  showCartItems();
}

function deleteItemTrigger() {
  cartItems.splice(this, 1);
  showCartItems();
}

function showCartItems() {
  let masterDiv = document.createElement('div');
  let totalAmount = 0;
  cartItems.forEach((cartItem, index) => {
    let div0 = document.createElement('div');
    div0.className = "row border-bottom cl_cart_item";

    let div1 = document.createElement('div');
    div1.className = "col-sm-1";
    div1.innerHTML = index + 1;

    let input1 = document.createElement('label');
    input1.innerHTML = cartItem.item_name;
    input1.readOnly = true;
    input1.style = "width: 100%;";
    let div2 = document.createElement('div');
    div2.className = "col-sm-4";
    div2.appendChild(input1);

    let input2 = document.createElement('label');
    input2.innerHTML = cartItem.unit_rate
    input2.style = "width: 100%;";
    input2.readOnly = true;
    let div3 = document.createElement('div');
    div3.className = "col-sm-2";
    div3.appendChild(input2);

    let input3 = document.createElement('input');
    input3.type = "text";
    input3.id = "quantity-" + index;
    input3.value = cartItem.quantity;
    input3.autocomplete = "off";
    input3.style = "width:100%";
    input3.className = "";
    input3.addEventListener("focusout", quantityChangeTrigger);

    let qtyDiv = document.createElement('div');
    qtyDiv.className = "input-group";
    qtyDiv.appendChild(input3);

    let div4 = document.createElement('div');
    div4.className = "col-sm-2";
    div4.appendChild(qtyDiv);

    let div5 = document.createElement('div');
    div5.className = "col-sm-2";
    div5.innerHTML = (Math.round((cartItem.unit_rate * cartItem.quantity) * 100) / 100).toFixed(2);

    let deleteDiv = document.createElement('i');
    deleteDiv.className = "btn-close";
    deleteDiv.addEventListener("click", deleteItemTrigger.bind(index));
    let div6 = document.createElement('div');
    div6.className = "col-sm-1";
    div6.appendChild(deleteDiv);

    totalAmount += cartItem.unit_rate * cartItem.quantity;

    div0.appendChild(div1);
    div0.appendChild(div2);
    div0.appendChild(div4);
    div0.appendChild(div3);
    div0.appendChild(div5);
    div0.appendChild(div6);
    masterDiv.appendChild(div0);

  });
  document.getElementById("shoppingcart_items").replaceChildren(masterDiv);
  document.getElementById("total_amount").innerHTML = (Math.round(totalAmount * 100) / 100).toFixed(2);
  let discountVal = document.getElementById("discount_amount").value;
  let discount = parseFloat(discountVal ? discountVal : 0);
  document.getElementById("grand_total_amount").innerHTML = (Math.round((totalAmount - discount) * 100) / 100).toFixed(2);
  document.getElementById("total_quantity").innerHTML = cartItems.length;
}


function loadTempOrders() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      try {
        var response = JSON.parse(this.responseText);
        if (response?.temporary_save[0]?.message === 'success') {
          let orders = [...response.temporary_save]
          orders.shift();
          displayTempOrders(orders);
        }
        else {
          document.getElementById("errorToast_message").innerHTML = "Error Loading Temporary Orders 1";
          errorToast.show();
        }
      } catch (error) {
        document.getElementById("errorToast_message").innerHTML = "Error Loading Temporary Orders 2";
        errorToast.show();
      }

    }
  };
  //TODO - change URL http://www.agnisolutions.com/alnadir/pos_temporary_retrieve.php
  xhttp.open("GET", "./data/pos_temporary_retrieve.json", true);
  xhttp.send();
}


function displayTempOrders(tempOrders) {
  if (tempOrders && tempOrders.length == 0) {
    document.getElementById("warningToast_message").innerHTML = "No Temporary Orders to Display";
    warningToast.show();
  }
  else {
    let form = document.createElement("div");
    form.style = "max-height: 30vh;overflow-x: hidden;overflow-y: auto;"
    tempOrders.forEach(order => {
      let customer;
      let products = [];
      order.forEach(orderItem => {
        if (orderItem.hasOwnProperty('customer')) {
          customer = orderItem.customer;
        }
        else {
          products.push(orderItem);
        }
      });
      
      let div1 = document.createElement("div");
      //div1.className = "card";
      div1.style = "border-bottom: 1px solid #acc6ef;"
      div1.className = "row";
      //div1.setAttribute("data-bs-dismiss", "modal");

      let div2 = document.createElement("div");
      div2.className = "col-sm-8";

      let div2_action = document.createElement("div");
      div2_action.className = "col-sm-3";
      //to vertically align
      //div2_action.className = "col-sm-3 d-grid gap-2 col-6 mx-auto";
      div2_action.style = "align-self: center;";

      let div_edit = document.createElement("div");
      div_edit.className = "col-sm-6 btn bi bi-pencil-square";
      div_edit.onclick = addTempOrderToCart.bind({"customer":customer,"products":products});
      div2_action.appendChild(div_edit);

      let div_delete = document.createElement("div");
      div_delete.className = "col-sm-6 btn bi bi-trash";
      div2_action.appendChild(div_delete);

      let div1_1 = document.createElement("h6");
      //div1_1.className = "card-title";
      div1_1.innerHTML= customer;
      div2.appendChild(div1_1);

      products.forEach(prod => {
        
        let div1_2 = document.createElement("div");
        div1_2.className = "col-sm-12";
        div1_2.innerHTML = prod.item_name + " (  &#8377; "+prod.unit_rate+" )";
        div2.appendChild(div1_2);
      });
      div1.appendChild(div2);
      div1.appendChild(div2_action);
      
      form.appendChild(div1);
    });
    document.getElementById("load_temp_order_body_1").replaceChildren(form);
    document.getElementById("temp_order_count").innerHTML = tempOrders.length;
    // let myModal = new bootstrap.Modal(document.getElementById('load_temp_order'), {
    //   keyboard: false
    // });
    // myModal.toggle();
  }
}
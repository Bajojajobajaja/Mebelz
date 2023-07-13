const guideList = document.querySelector('.guides');
const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const accountDetails = document.querySelector('.account-details');
const cartList = document.querySelector('.cart-items');
const ordersTable = document.querySelector('.order-items');

// setup materialize components
document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});

const setupUI = (user) => {
  if (user) {
    // account info
    db.collection('users').doc(user.uid).get().then(doc => {
      const html = `
        <div>О вас: ${doc.data().bio}</div>
        <div>Ваша почта: ${user.email}</div>
      `;
      accountDetails.innerHTML = html;
    });

    // toggle user UI elements
    loggedInLinks.forEach(item => item.style.display = 'block');
    loggedOutLinks.forEach(item => item.style.display = 'none');

  } else {
    // clear account info
    accountDetails.innerHTML = '';
    // toggle user elements
    loggedInLinks.forEach(item => item.style.display = 'none');
    loggedOutLinks.forEach(item => item.style.display = 'block');
  }
};


// Функция для отображения заказов пользователя
const setupOrders = (data) => {
  if (data.length) {
    let html = '';
    data.forEach(doc => {
      const order = doc.data();
      const date = order.timestamp.toDate().toLocaleDateString(); // преобразование даты в строку
      order.items.forEach(item => {
        const tr = `
          <tr>
            <td>${item.title}</td>
            <td><img src="${item.picture}" alt="picture" style="max-width: 30px; max-height: 30px; min-width: 30px; min-height: 30px;"></td>
            <td>${date}</td>
            <td>В процессе</td>
          </tr>
        `;
        html += tr;
      });
    });
    ordersTable.innerHTML = html;
  } else {
    ordersTable.innerHTML = '<h5 class="center-align">У вас пока нет заказов</h5>';
  }
};

// setup guides
const setupGuides = (data) => {

  if (data.length) {
    let html = '';
    data.forEach(doc => {
      const guide = doc.data();
      const li = `
        <li>
          <div class="collapsible-header grey lighten-4"> ${guide.title} </div>
          <div class="collapsible-body white">
            Описание: ${guide.content} <br> 
            Цена: ${guide.price} рублей <br> 
            <img src="${guide.picture}" alt="picture" style="max-width: 100px; max-height: 100px; min-width: 100px; min-height: 100px;"> <br>
            <button class="btn aquamarine darken-2 z-depth-0 add-to-cart-button" data-id="${doc.id}">Добавить в корзину</button>
          </div>
        </li>
      `;
      html += li;
    });
    guideList.innerHTML = html;

    const addToCartButtons = document.querySelectorAll('.btn');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const id = event.target.dataset.id;
        const guide = data.find(doc => doc.id === id).data();
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const index = cart.findIndex(cartItem => cartItem.id === guide.id);
        if (index === -1) {
            cart.push(guide);
            localStorage.setItem('cart', JSON.stringify(cart));
            setupCart();
            //alert("Товар успешно добавлен в корзину!");
        } else {
            alert("Этот товар уже в корзине!");
        }
      });
    });
  } else {
    guideList.innerHTML = '<h5 class="center-align">Зарегестрируйтесь чтобы видеть товары!</h5>';
  }
};


const setupCart = () => {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length > 0) {
    let html= '';
    cart.forEach(item => {
      const li = `
        <tr>
          <td>${item.title}</td>
          <td><img src="${item.picture}" alt="picture" style="max-width: 30px; max-height: 30px; min-width: 30px; min-height: 30px;"></td>
          <td>${item.price} рублей</td> 
        </tr> 
      `;
      html += li;
      
    });
    html += '<button class="btn aquamarine darken-2 z-depth-0" onclick="clearCart()">Удалить товары</button>';
    cartList.innerHTML = html;

  } else {
    cartList.innerHTML = '<h5 class="center-align">Корзина пуста</h5>';
  }
};

function clearCart() {
  localStorage.removeItem('cart');
  //alert("Корзина очищена");
  setupCart();
}

function clearOrder() {
  localStorage.removeItem('order');
  //alert("Корзина очищена");
  setupCart();
}

const checkoutForm = document.querySelector('#checkout-form');
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Получаем список товаров из корзины
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  if (cartItems.length !== 0) {
    // Удаляем товары из базы данных
    cartItems.forEach(item => {
      db.collection('guides').where('id', '==', item.id)
        .get()
        .then(querySnapshot => {
          querySnapshot.forEach(doc => {
            doc.ref.delete().then(() => {
              console.log("Document successfully deleted!");
            }).catch((error) => {
              console.error("Error removing document: ", error);
            });
          });
        });
    });

    // Очистка полей данных карты
    document.querySelector('#phone').value = '';
    document.querySelector('#cardNumber').value = '';
    document.querySelector('#expiry').value = '';
    document.querySelector('#cvv').value = '';

    // Добавляем информацию о заказе в базу данных
    db.collection('orders').add({
      items: cartItems,
      user: auth.currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      alert('Товары успешно приобретены!');
      clearCart();
      setupGuides(); // обновление списка товаров
    })
    .catch((error) => {
      console.error("Error adding document: ", error);
    });
  } else {
    alert('Корзина пуста!');
  }
});



const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
  setup() {
    // Store Data
    const storeData = ref(window.STORE_DATA || { profile: {}, categories: [] });
    const profile = computed(() => storeData.value.profile || {});
    const categories = computed(() => storeData.value.categories || []);

    // Navigation & Tab State
    const activeTab = ref('home'); // 'home' | 'search' | 'cart' | 'info'
    const activeCatId = ref(null);
    const searchQuery = ref('');
    const showCategoryDrawer = ref(false);
    
    // Modals Visibility
    const showItemModal = ref(false);
    const showCartModal = ref(false);
    const showCheckoutModal = ref(false);
    const showInfoModal = ref(false);
    const showToast = ref(false);
    const toastMessage = ref('');

    // Active Item Modal State
    const selectedItem = ref(null);
    const itemQuantity = ref(1);
    const itemObservation = ref('');
    const selectedOptions = ref({}); // { addonId: [subitemId, ...] }

    // Shopping Cart State
    const cart = ref([]);
    const orderType = ref('delivery'); // 'delivery' | 'takeout'

    // Customer Checkout State
    const customer = ref({
      name: '',
      phone: '',
      street: '',
      number: '',
      neighborhood: '',
      complement: '',
      reference: '',
      paymentMethod: 'pix',
      changeAmount: ''
    });

    // Load saved cart and customer details
    onMounted(() => {
      try {
        const savedCart = localStorage.getItem('q504_cart');
        if (savedCart) cart.value = JSON.parse(savedCart);
        
        const savedCustomer = localStorage.getItem('q504_customer');
        if (savedCustomer) customer.value = { ...customer.value, ...JSON.parse(savedCustomer) };
      } catch (e) {
        console.error('Error loading saved state:', e);
      }

      if (categories.value.length > 0) {
        activeCatId.value = categories.value[0].id;
      }

      // Check hash in URL
      if (window.location.hash) {
        const catId = window.location.hash.replace('#cat-', '');
        if (catId) activeCatId.value = catId;
      }
    });

    // Save cart state
    watch(cart, (newCart) => {
      try {
        localStorage.setItem('q504_cart', JSON.stringify(newCart));
      } catch (e) {}
    }, { deep: true });

    // Save customer state
    watch(customer, (newCust) => {
      try {
        localStorage.setItem('q504_customer', JSON.stringify(newCust));
      } catch (e) {}
    }, { deep: true });

    // Format currency (R$ 0,00)
    const formatMoney = (val) => {
      if (val === null || val === undefined || isNaN(val)) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Store Open / Closed Check
    const isStoreOpen = computed(() => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const curTimeMinutes = hours * 60 + minutes;

      const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayKey = daysMap[dayOfWeek];
      const todayHours = profile.value.business_hours?.[todayKey] || [];

      if (!todayHours || todayHours.length === 0) return false;

      for (const slot of todayHours) {
        if (slot.length === 2) {
          const [startH, startM] = slot[0].split(':').map(Number);
          const [endH, endM] = slot[1].split(':').map(Number);
          const startMin = startH * 60 + startM;
          const endMin = endH * 60 + endM;
          if (curTimeMinutes >= startMin && curTimeMinutes <= endMin) {
            return true;
          }
        }
      }
      return false;
    });

    // Highlighted / Featured Products ("Destaques")
    const highlightedItems = computed(() => {
      const highlights = [];
      categories.value.forEach(cat => {
        cat.items.forEach(item => {
          if (item.badge || item.promotional_price || highlights.length < 8) {
            if (!highlights.some(h => h.id === item.id)) {
              highlights.push(item);
            }
          }
        });
      });
      return highlights.slice(0, 10);
    });

    // Suggested Complementary Products ("Que tal levar junto?")
    const suggestedItems = computed(() => {
      const suggestions = [];
      categories.value.forEach(cat => {
        cat.items.forEach(item => {
          if (item.id !== selectedItem.value?.id && suggestions.length < 6) {
            suggestions.push(item);
          }
        });
      });
      return suggestions;
    });

    // Filtered Categories based on search query
    const filteredCategories = computed(() => {
      const query = searchQuery.value.trim().toLowerCase();
      if (!query) return categories.value;

      return categories.value.map(cat => {
        const matchingItems = cat.items.filter(item => 
          item.name.toLowerCase().includes(query) || 
          (item.description && item.description.toLowerCase().includes(query))
        );
        return {
          ...cat,
          items: matchingItems
        };
      }).filter(cat => cat.items.length > 0);
    });

    // Select product to open detail modal
    const openItemModal = (item) => {
      selectedItem.value = item;
      itemQuantity.value = 1;
      itemObservation.value = '';
      selectedOptions.value = {};

      if (item.add_ons && item.add_ons.length > 0) {
        item.add_ons.forEach(addon => {
          selectedOptions.value[addon.id] = [];
          if (addon.minimum_quantity > 0 && addon.subitems && addon.subitems.length > 0) {
            if (addon.choice_type === 'SINGLE') {
              selectedOptions.value[addon.id] = [addon.subitems[0].id];
            }
          }
        });
      }

      showItemModal.value = true;
    };

    // Add suggested item directly to cart
    const addQuickItemToCart = (item) => {
      cart.value.push({
        id: Date.now() + Math.random(),
        item: item,
        quantity: 1,
        unitPrice: item.promotional_price ?? item.price ?? item.minimum_price ?? 0,
        totalPrice: item.promotional_price ?? item.price ?? item.minimum_price ?? 0,
        optionsText: '',
        observation: ''
      });
      triggerToast(`${item.name} adicionado à sacola!`);
    };

    // Toggle add-on subitem selection
    const toggleSubitem = (addon, subitem) => {
      const list = selectedOptions.value[addon.id] || [];
      const isSingle = addon.choice_type === 'SINGLE' || addon.maximum_quantity === 1;

      if (isSingle) {
        selectedOptions.value[addon.id] = [subitem.id];
      } else {
        const idx = list.indexOf(subitem.id);
        if (idx > -1) {
          list.splice(idx, 1);
        } else {
          if (!addon.maximum_quantity || list.length < addon.maximum_quantity) {
            list.push(subitem.id);
          }
        }
        selectedOptions.value[addon.id] = [...list];
      }
    };

    const isSubitemSelected = (addonId, subitemId) => {
      const list = selectedOptions.value[addonId] || [];
      return list.includes(subitemId);
    };

    // Calculate Modal Unit Price
    const modalUnitPrice = computed(() => {
      if (!selectedItem.value) return 0;
      let price = selectedItem.value.promotional_price ?? selectedItem.value.price ?? selectedItem.value.minimum_price ?? 0;

      if (selectedItem.value.add_ons) {
        selectedItem.value.add_ons.forEach(addon => {
          const selectedIds = selectedOptions.value[addon.id] || [];
          if (addon.subitems) {
            addon.subitems.forEach(sub => {
              if (selectedIds.includes(sub.id)) {
                price += (sub.price || 0);
              }
            });
          }
        });
      }
      return price;
    });

    const modalTotalPrice = computed(() => {
      return modalUnitPrice.value * itemQuantity.value;
    });

    // Add item to cart
    const addToCart = () => {
      if (!selectedItem.value) return;

      const optionsTextList = [];
      if (selectedItem.value.add_ons) {
        selectedItem.value.add_ons.forEach(addon => {
          const selectedIds = selectedOptions.value[addon.id] || [];
          if (addon.subitems) {
            addon.subitems.forEach(sub => {
              if (selectedIds.includes(sub.id)) {
                let text = sub.name;
                if (sub.price && sub.price > 0) {
                  text += ` (+${formatMoney(sub.price)})`;
                }
                optionsTextList.push(text);
              }
            });
          }
        });
      }

      cart.value.push({
        id: Date.now() + Math.random(),
        item: selectedItem.value,
        quantity: itemQuantity.value,
        unitPrice: modalUnitPrice.value,
        totalPrice: modalTotalPrice.value,
        optionsText: optionsTextList.join(', '),
        observation: itemObservation.value.trim()
      });

      showItemModal.value = false;
      triggerToast('Item adicionado à sua sacola!');
    };

    // Trigger Toast
    const triggerToast = (msg) => {
      toastMessage.value = msg;
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 2500);
    };

    // Cart Adjustments
    const updateCartQuantity = (index, delta) => {
      if (index < 0 || index >= cart.value.length) return;
      const cartItem = cart.value[index];
      cartItem.quantity += delta;
      if (cartItem.quantity <= 0) {
        cart.value.splice(index, 1);
      } else {
        cartItem.totalPrice = cartItem.unitPrice * cartItem.quantity;
      }
    };

    const cartCount = computed(() => {
      return cart.value.reduce((sum, item) => sum + item.quantity, 0);
    });

    const cartSubtotal = computed(() => {
      return cart.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    });

    const deliveryFee = computed(() => {
      return orderType.value === 'delivery' ? 8.00 : 0.00;
    });

    const cartTotal = computed(() => {
      return cartSubtotal.value + deliveryFee.value;
    });

    // Scroll to category section
    const scrollToCategory = (catId) => {
      activeCatId.value = catId;
      showCategoryDrawer.value = false;
      window.location.hash = `cat-${catId}`;

      const el = document.getElementById(`cat-${catId}`);
      if (el) {
        const yOffset = -75;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };

    // Bottom Bar Navigation Handlers
    const setTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (tab === 'search') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          const searchInput = document.getElementById('search-input');
          if (searchInput) searchInput.focus();
        }, 100);
      } else if (tab === 'cart') {
        showCartModal.value = true;
      } else if (tab === 'info') {
        showInfoModal.value = true;
      }
    };

    // Submit WhatsApp Order
    const sendWhatsAppOrder = () => {
      if (!customer.value.name.trim()) {
        alert('Por favor, informe seu nome para o pedido.');
        return;
      }
      if (!customer.value.phone.trim()) {
        alert('Por favor, informe seu telefone de contato.');
        return;
      }
      if (orderType.value === 'delivery') {
        if (!customer.value.street.trim() || !customer.value.number.trim() || !customer.value.neighborhood.trim()) {
          alert('Por favor, preencha a rua, número e bairro para a entrega.');
          return;
        }
      }

      let msg = `🧀 *NOVO PEDIDO - QUEIJEIRA 504*\n`;
      msg += `-----------------------------------\n`;
      msg += `👤 *Cliente:* ${customer.value.name.trim()}\n`;
      msg += `📞 *Telefone:* ${customer.value.phone.trim()}\n`;
      msg += `📍 *Tipo:* ${orderType.value === 'delivery' ? 'Entrega em Domicílio' : 'Retirada na Loja'}\n`;

      if (orderType.value === 'delivery') {
        msg += `🏠 *Endereço:* ${customer.value.street.trim()}, Nº ${customer.value.number.trim()}\n`;
        msg += `🏙️ *Bairro:* ${customer.value.neighborhood.trim()}\n`;
        if (customer.value.complement.trim()) msg += `🏢 *Complemento:* ${customer.value.complement.trim()}\n`;
        if (customer.value.reference.trim()) msg += `📍 *Ponto de Ref.:* ${customer.value.reference.trim()}\n`;
      }

      msg += `-----------------------------------\n`;
      msg += `🛒 *ITENS DO PEDIDO:*\n\n`;

      cart.value.forEach((cItem) => {
        msg += `*${cItem.quantity}x ${cItem.item.name}* - ${formatMoney(cItem.unitPrice * cItem.quantity)}\n`;
        if (cItem.optionsText) {
          msg += `   └ _Opções:_ ${cItem.optionsText}\n`;
        }
        if (cItem.observation) {
          msg += `   └ _Obs:_ ${cItem.observation}\n`;
        }
        msg += `\n`;
      });

      msg += `-----------------------------------\n`;
      msg += `💵 *Subtotal:* ${formatMoney(cartSubtotal.value)}\n`;
      if (orderType.value === 'delivery') {
        msg += `🛵 *Taxa de Entrega:* ${formatMoney(deliveryFee.value)}\n`;
      }
      msg += `💰 *TOTAL DO PEDIDO:* ${formatMoney(cartTotal.value)}\n`;

      msg += `-----------------------------------\n`;
      msg += `💳 *Forma de Pagamento:* `;
      if (customer.value.paymentMethod === 'pix') msg += `Pix\n`;
      else if (customer.value.paymentMethod === 'money') {
        msg += `Dinheiro`;
        if (customer.value.changeAmount) msg += ` (Troco para ${customer.value.changeAmount})`;
        msg += `\n`;
      } else if (customer.value.paymentMethod === 'card') msg += `Cartão (na entrega/retirada)\n`;
      
      msg += `\nObrigado por comprar na *Queijeira 504*! 🧀✨`;

      const targetPhone = profile.value.order_whatsapp || '5583993064658';
      const encodedMsg = encodeURIComponent(msg);
      const waUrl = `https://wa.me/${targetPhone}?text=${encodedMsg}`;

      cart.value = [];
      showCheckoutModal.value = false;
      showCartModal.value = false;

      window.open(waUrl, '_blank');
    };

    return {
      profile,
      categories,
      filteredCategories,
      highlightedItems,
      suggestedItems,
      activeTab,
      activeCatId,
      searchQuery,
      showCategoryDrawer,
      showItemModal,
      showCartModal,
      showCheckoutModal,
      showInfoModal,
      showToast,
      toastMessage,
      selectedItem,
      itemQuantity,
      itemObservation,
      selectedOptions,
      cart,
      orderType,
      customer,
      formatMoney,
      isStoreOpen,
      openItemModal,
      addQuickItemToCart,
      toggleSubitem,
      isSubitemSelected,
      modalUnitPrice,
      modalTotalPrice,
      addToCart,
      updateCartQuantity,
      cartCount,
      cartSubtotal,
      deliveryFee,
      cartTotal,
      scrollToCategory,
      setTab,
      sendWhatsAppOrder
    };
  }
}).mount('#app');


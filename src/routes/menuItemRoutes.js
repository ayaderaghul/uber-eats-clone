const express = require('express')
const router = express.Router()
const MenuItem = require('../models/MenuItem')
const {protect, authorize} = require('../middlewares/authMiddleware')
const CacheSerivce = require('../services/cacheService')
router.get('/restaurant/:restaurantId', async(req,res) => {
    try{
        // const menuItems = await MenuItem.find({
        //     restaurant: req.params.restaurantId,
        //     available:true
        // })

        const menuItems = await CacheSerivce.getOrSetAutoHotness(
          `menu:${req.params.restaurantId}`,
          3600,
          () => MenuItem.find({
            retaurant: req.params.restaurantId,
            available: true
          }),
          100 // threshold for hot: 100 req in 5 min
        )

        res.json(menuItems)
    }catch(err){
        res.status(500).json({message: err.message})
    }
})

router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, authorize('restaurant', 'admin'), async (req, res) => {
  const menuItem = new MenuItem({
    restaurant: req.body.restaurant,
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    imageUrl: req.body.imageUrl,
    category: req.body.category
  });

  try {
    const newMenuItem = await menuItem.save();
    res.status(201).json(newMenuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, authorize('restaurant', 'admin'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await CacheService.del(`menu:${menuItem.restaurant}`)
    res.json(menuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, authorize('restaurant', 'admin'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/restaurant/:restaurantId/category/:category', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({
      restaurant: req.params.restaurantId,
      category: req.params.category,
      available: true
    });
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

router.patch('/:id/availability', protect, authorize('restaurant', 'admin'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    menuItem.available = !menuItem.available;
    const updatedMenuItem = await menuItem.save();
    
    res.json(updatedMenuItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})

router.get('/search', async (req, res) => {
  const { restaurantId, query } = req.query;
  
  try {
    const menuItems = await MenuItem.find({
      restaurant: restaurantId,
      available: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

module.exports = router
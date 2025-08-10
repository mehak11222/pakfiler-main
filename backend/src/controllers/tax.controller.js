import TaxFiling from "../models/tax.model.js";

export const submitTax = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Tax filing data is required" });
    }

    const tax = await TaxFiling.create({ 
      ...req.body, 
      userId: req.user.id 
    });
    
    res.status(201).json({
      message: "Tax filing submitted successfully",
      tax
    });
  } catch (err) {
    console.error('Submit tax error:', err);
    res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

export const getTaxHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const taxes = await TaxFiling.find({ userId: req.user.id });
    
    res.json({
      message: "Tax history retrieved successfully",
      count: taxes.length,
      taxes
    });
  } catch (err) {
    console.error('Get tax history error:', err);
    res.status(500).json({ 
      message: "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

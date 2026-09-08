const express=require("express");
const multer=require("multer");
const path=require("path");
const fs=require("fs");
const crypto=require("crypto");

const app=express();
const PORT=process.env.PORT||3000;
const DATA=path.join(__dirname,"data");
const UP=path.join(__dirname,"uploads");
fs.mkdirSync(DATA,{recursive:true}); fs.mkdirSync(UP,{recursive:true});

const db=path.join(DATA,"products.json");
if(!fs.existsSync(db)) fs.writeFileSync(db,"[]");

const upload=multer({storage:multer.diskStorage({
  destination:(_req,_file,cb)=>cb(null,UP),
  filename:(_req,file,cb)=>cb(null,Date.now()+"-"+crypto.randomBytes(5).toString("hex")+path.extname(file.originalname))
}),limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>{
  cb(null,/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype));
}});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use("/uploads",express.static(UP));

const read=()=>JSON.parse(fs.readFileSync(db,"utf8"));
const write=x=>fs.writeFileSync(db,JSON.stringify(x,null,2));

app.get("/api/products",(_req,res)=>res.json(read()));

app.post("/api/products",upload.single("image"),(req,res)=>{
  try{
    if(!req.file) return res.status(400).json({error:"Please upload a product image."});
    const {name,price,description,category}=req.body;
    if(!name||!price) return res.status(400).json({error:"Product name and price are required."});
    const products=read();
    const product={
      id:crypto.randomUUID(), name:name.trim(), price:Number(price),
      description:(description||"Handcrafted with love by Belora.").trim(),
      category:(category||"Candles").trim(),
      image:"/uploads/"+req.file.filename,
      createdAt:new Date().toISOString()
    };
    products.unshift(product); write(products); res.json(product);
  }catch(e){console.error(e);res.status(500).json({error:"Could not add product."})}
});

app.delete("/api/products/:id",(req,res)=>{
  const products=read(); const p=products.find(x=>x.id===req.params.id);
  if(!p)return res.status(404).json({error:"Product not found."});
  write(products.filter(x=>x.id!==req.params.id));
  if(p.image?.startsWith("/uploads/")) {
    const f=path.join(UP,path.basename(p.image));
    if(fs.existsSync(f)) fs.unlinkSync(f);
  }
  res.json({success:true});
});

app.post("/api/order",(req,res)=>{
  try{
    const {customer,items}=req.body;
    if(!customer?.name||!customer?.phone||!customer?.address) return res.status(400).json({error:"Name, phone and address are required."});
    if(!Array.isArray(items)||!items.length) return res.status(400).json({error:"Cart is empty."});
    const products=read();
    const clean=items.map(i=>{
      const p=products.find(x=>x.id===i.id);
      if(!p)throw new Error("A product is no longer available.");
      return {id:p.id,name:p.name,price:p.price,qty:Math.max(1,Number(i.qty||1))};
    });
    const subtotal=clean.reduce((s,i)=>s+i.price*i.qty,0);
    const shipping=subtotal>=999?0:79;
    const total=subtotal+shipping;
    const order={id:"BEL-"+Date.now(),createdAt:new Date().toISOString(),customer,items:clean,subtotal,shipping,total};
    const ordersFile=path.join(DATA,"orders.json");
    const orders=fs.existsSync(ordersFile)?JSON.parse(fs.readFileSync(ordersFile,"utf8")):[];
    orders.unshift(order); fs.writeFileSync(ordersFile,JSON.stringify(orders,null,2));
    res.json({success:true,order});
  }catch(e){console.error(e);res.status(400).json({error:e.message||"Could not place order."})}
});

app.get("/api/orders",(_req,res)=>{
  const f=path.join(DATA,"orders.json");
  res.json(fs.existsSync(f)?JSON.parse(fs.readFileSync(f,"utf8")):[]);
});

app.get("*",(_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("Belora running on http://localhost:"+PORT));

exports.home = (req,res)=>{
     res.status(200).json({
        success: true,
        greeting: "Hello From API",
     });
};

exports.homeDummy = (req,res)=>{
    res.status(200).json({
       success: true,
       greeting: "this is dummy data",
    });
};
// try catch and async -await || use Promise 

module.exports = (fun)=>(req,res,next)=>{
    Promise.resolve(fun(req,res,next)).catch(next);
}
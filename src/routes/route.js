const { Router } = require('express')
const router = Router()

router.get('/test', function(req, res){
    console.log("Hello")
})

module.exports = router
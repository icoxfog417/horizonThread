
/*
 * GET home page.
 */

//Route to home

exports.index = function(db,req, res){
	res.render('index', { title: 'HorizonThread' })	
};

//Route for login , get or create ScheduleAdjust
exports.login = function(db,req,res){
	//connect to db
	db.connectDB()
		
	var schema = require('../schemas/ScheduleAdjust.js');
	schema.ScheduleAdjustRegister(db);
	var ScheduleAdjust = db.model("ScheduleAdjust")
	
	//get parameter
	var said = req.param("said","")
	//console.log("id is " + said );
	var postObj = null;
	if(said != ""){
		ScheduleAdjust.findOne( {_id:said},
		function(err,obj){
			if(!err && obj != null){
				obj.schedules.sort(function(a,b){ return parseInt(a.sDate)-parseInt(b.sDate)})
				//console.log("find object is " + obj );				
				res.render('vote', { saObj:obj});
			}else{
				res.render('index', {msg:"指定されたスケジュールがありません"})			
			}
		});
	}else if(typeof req.body.login.name !== undefined){
		postObj = new ScheduleAdjust();
		if(req.body.login.name != ""){
			postObj.name = req.body.login.name
		}else{
			postObj.name = req.body.login.tmpname;			
		}
		//create object
		postObj.save(function(err){
			//db.disconnect();
			if(!err){ 
				res.redirect("/login?said=" + postObj._id)		//for counter to reload 
			}else{
				res.render('index', {msg:"スケジュールの作成に失敗しました"})
			}
		});
	}else{
		res.render('index', {msg:"必要なパラメーターがないため、処理に失敗しました"})
	}
	
}

exports.reloadList = function(db,req, res){
	//connect to db
	db.connectDB()
		
	var schema = require('../schemas/ScheduleAdjust.js');
	schema.ScheduleAdjustRegister(db);
	var ScheduleAdjust = db.model("ScheduleAdjust")
	
	//find schedule
	console.log("load data of " + req.param("said",""))
	ScheduleAdjust.findOne({_id:req.param("said","")},function(err,obj){
		if(obj !== undefined){
			obj.schedules.sort(function(a,b){ return parseInt(a.sDate)-parseInt(b.sDate)})			
		}

		//db.disconnect();
		//console.log("load data end " + obj)
		res.render('hp_scheduleList', { layout:false,saObj:obj});	
	})
};

//Route for manage Schedule
exports.schedule = function(db,req, res){
	//connect to db
	db.connectDB()
		
	//create schedule object
	var schema = require('../schemas/ScheduleAdjust.js');
	schema.ScheduleAdjustRegister(db);
	var Schedule = db.model("Schedule");
	
	//set request Data	
	console.log("request data is " + req.body.schedule.id + "/" +req.body.schedule.sDate)
	var sc = new Schedule();
	var sc_id =req.body.schedule.id;
	var actionType = req.param("aType","")
	sc.sDate = req.body.schedule.sDate;
	sc.sTime = req.body.schedule.sTime;
	
	//getParent
	var ScheduleAdjust = db.model("ScheduleAdjust");
	ScheduleAdjust.findOne({_id:req.body.schedule.parentId},function(err,obj){
		if(!err && obj != null){
			//create schedule date
			switch(actionType){
				case "create":
					var isExist = false;
					for(var i = 0; i < obj.schedules.length;i++){
						if(obj.schedules[i].sDate == sc.sDate) isExist = true;
					}
					if(!isExist){
						obj.schedules.push(sc)
						obj.save(function(err){ 
							//db.disconnect(); 
							res.render('hp_scheduleList', { layout:false,saObj:obj});	
						});
					}else{
						res.render('hp_scheduleList', { layout:false,saObj:obj});
					}
					break;		
				case "delete":
					obj.schedules.id(sc_id).remove();
					obj.save(function(err){ 
						console.log("delete schedule " + sc_id)
						//db.disconnect();
						 res.render('hp_scheduleList', { layout:false,saObj:obj});	
					});
					break;
			}
		}else{
			//error handling
			//db.disconnect();
			res.end({msg:" when schedule " + actionType + " , occur error"});
		}
	})

};

exports.scAdjustDelete = function(db,req, res){
	//connect to db
	db.connectDB()
		
	var said = req.param("said","");

	var schema = require('../schemas/ScheduleAdjust.js');
	schema.ScheduleAdjustRegister(db);
	var ScheduleAdjust = db.model("ScheduleAdjust");
	
	ScheduleAdjust.findOne({_id:said},function(err,obj){
		if(!err){
			obj.remove();
		}
	})	
	res.redirect('/');		

};


exports.vote = function(db,req, res, actionType){
	//connect to db
	db.connectDB()
		
	//create schedule object
	var schema = require('../schemas/ScheduleAdjust.js');
	schema.ScheduleAdjustRegister(db);
	var Vote = db.model("Vote");
	
	//set request Data	
	console.log("request data is " + req.body.vote.parentId + " : " +req.body.vote.id)
	var v = new Vote();
	var v_id =req.body.vote.id;
	var actionType = req.param("aType","")
	var ids = req.body.vote.parentId.split("/");
	var sa_id = ids[0];
	var sc_id = ids[1];
	v.name = req.body.vote.name;
	v.status = req.body.vote.status;
	v.comment = req.body.vote.comment;
	
	//getParent
	var ScheduleAdjust = db.model("ScheduleAdjust");
	ScheduleAdjust.findOne({_id:sa_id},function(err,obj){
		if(!err && obj != null){
			//get date
			var sc = obj.schedules.id(sc_id);
			var vt = sc.votes.id(v_id);
			if(vt == null){
				for(var i = 0; i < sc.votes.length;i++){
					if(sc.votes[i].name == v.name) vt = sc.votes[i]; break;
				}				
			}			
			
			//create schedule date
			switch(actionType){
				case "save":
					if(vt == null){
						//console.log("create vote " + v)
						sc.votes.push(v)
						obj.save(function(err){ 
							//db.disconnect();
							 res.render('hp_scheduleList', { layout:false,saObj:obj});	
						});					
					}else{
						vt.name = v.name;
						vt.status = v.status;
						vt.comment = v.comment;
	
						//console.log("update vote " + vt)
						obj.save(function(err){ 
							//db.disconnect();
							 res.render('hp_scheduleList', { layout:false,saObj:obj});	
						});						
					}
					break;		
				case "delete":
					sc.votes.id(v_id).remove();
					obj.save(function(err){ 
						//console.log("delete vote " + v_id)
						//db.disconnect();
						 res.render('hp_scheduleList', { layout:false,saObj:obj});	
					});
			}
		}else{
			//error handling
			//db.disconnect();
			res.end({msg:" when voting " + actionType + " , occur error"});
		}
	})	
};

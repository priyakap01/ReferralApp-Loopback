
module.exports = function(CustomerModel) {
//For fetching customer details by customer ID	
CustomerModel.getCustomerById = function(id,cb) {
   CustomerModel.find({ where:{'customer_id':id}}, function(err, docs){
		if (err) return next(err);
		cb(null,docs);   
	});
  };
 
//Fetch All Children Under A Customer
CustomerModel.fetchAllChildren = function (id, cb) {
  CustomerModel.find({where:{'referral_id' : id}}, function(err, docs){
    if (err) return next(err);
    cb(null,docs);   
  });
};

//For fetching all ambassador children
CustomerModel.fetchAmbassadorChildren = function (id, cb) {
  CustomerModel.find({where:{'isAmbassador':true}},function(){
		CustomerModel.find({'referral_id' :id},function(err,docs){
			if (err) return next(err);
			cb(null,docs);
		});
	})
};

//For Adding A Referral Under A Customer
CustomerModel.addReferral = function(data,cb){
	CustomerModel.update({where:{'customer_id': data.referral_id}},{ $inc: { 'payback': 30}},{ $currentDate: {'lastUpdated': true}},function(){
		CustomerModel.create(data, function (er, docs) {
			if (er) return next(er);
			cb(null,docs);
		});
	});
};
  
//convert customer to ambassador  
CustomerModel.convertToAmbassador = function(id,cb,next) {
	CustomerModel.update({where:{'customer_id':id}},{$set:{'isAmbassador':true}}, function (err, docs) {
		if (err) return next(err);
		cb(null,docs);
	});
}; 
 
//Fetch all the customers with referral count in descending count 
CustomerModel.referralCount = function(cb){
	CustomerModel.aggregate([{$group:{_id :'$referral_id', count: { $sum: 1}}},{$sort:{"count":-1}}],function(err,post){
		if(err) return next(err);
		cb(null,post);
	});
};

//Fetch all children at nth level)
CustomerModel.fetchByLevel = function(id1,id2,cb){
	var n= id2;
	var allChildren =[];
		rec(n,id1);
		function rec(n,id){
			if(n == 0) return ;
			else if(n ==1) {
				CustomerModel.find({where:{'referral_id' : id}}, function(err, docs){
				if (docs == "") return;
				if (err) return next(err);
				allChildren.push.apply(allChildren,docs);
				});
			}
			else {
				CustomerModel.find({where:{'referral_id' : id}}, function(err, docs){
				if (docs == "") return;
				if (err) return next(err);
				for(i in docs){
					rec(n-1,docs[i].customer_id);
				}
				});
			}	
		}	
	setTimeout(function(){
		cb(null,allChildren)
	},1000)		
};


//Registering remote methods
	CustomerModel.remoteMethod('getCustomerById', {
      http: {path: '/getCustomerById',verb: 'get'},
	  accepts: {arg: 'id',type: 'number',required:'true',http: { source: 'query' }},
      returns: {arg: 'response',type: 'array',root :true}
	});
	
	CustomerModel.remoteMethod('fetchAllChildren', {
      http: {path: '/fetchAllChildren',verb: 'get'},
	  accepts: {arg: 'id',type: 'number',http: { source: 'query'},
		required:'true'},
      returns: {arg: 'response',type: 'array',root :true}
	});
	
	CustomerModel.remoteMethod('fetchAmbassadorChildren', {
      http: {path: '/fetchAmbassadorChildren',verb: 'get'},
	  accepts: {arg: 'id',type: 'number',required:'true',
		http: { source: 'query' }},
      returns: {arg: 'response',type: 'array',root :true}
	});
	
	CustomerModel.remoteMethod('addReferral', {
      http: {path: '/addReferral',verb: 'post'},
	  accepts: {arg: 'data',type: 'object',required:'true',
		http: { source: 'body' }},
      returns: {arg: 'response',type: 'array',root :true}
	});
	
	CustomerModel.remoteMethod('convertToAmbassador', {
      http: {path: '/convertCustomerToAmbassador',verb: 'put'},
	  accepts: {arg: 'id',type: 'number',required:'true',
		http: { source: 'query' }},
      returns: {arg: 'response',type: 'array',root :true}
	});
	
	CustomerModel.remoteMethod('referralCount', {
      http: {path: '/fetchReferralCount',verb: 'get'},
      returns: {arg: 'response',type: 'array',root :true}
	});
	
	CustomerModel.remoteMethod('fetchByLevel', {
      http: {path: '/fetchChildrenAtNthLevel',verb: 'get'},
	  accepts: [{arg: 'id1',type: 'number',required:'true',
	  http: { source: 'query' }},{arg: 'id2',type: 'number',required:'true',
		http: { source: 'query' }}],
      returns: {arg: 'response',type: 'array',root :true}
	});
};

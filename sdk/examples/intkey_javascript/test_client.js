/**
 * Copyright 2016 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ------------------------------------------------------------------------------
 */

const INT_KEY_FAMILY = 'intkey'
const INT_NAME = 'jfh'

const address = calculateAddress(INT_KEY_FAMILY, INT_NAME)

batchBytes = createBatch(address)
submitBatches(batchBytes)

function createBatch(address) {

	const cbor =  require('cbor')
	const {signer} = require('sawtooth-sdk')
	const privateKey = signer.makePrivateKey()
	const {TransactionEncoder} = require('sawtooth-sdk')


	const encoder = new TransactionEncoder(privateKey, {
	    familyName: 'intkey',
	    familyVersion: '1.0',
//	    inputs: ['12f126553f8181d817821210bc0030f836de0fee44468be019b5d171b507c845d59595'],
//	    outputs: ['12f126553f8181d817821210bc0030f836de0fee44468be019b5d171b507c845d59595'],
	    inputs: [address],
	    outputs: [address],
	    payloadEncoding: 'application/cbor',
	    payloadEncoder: cbor.encode
	})

	//const payload = {
//	    Verb: 'set',
//	    Name: 'jfh',
//	    Value: 42
	//}
	//
	//const payloadBytes = cbor.encode(payload)
	//
	//const txn = encoder.create(payload, {
//	    inputs: ['1cf126553f8181d817821210bc0030f836de0fee44468be019b5d171b507c845d59595'],
//	    outputs: ['1cf126553f8181d817821210bc0030f836de0fee44468be019b5d171b507c845d59595']
	//})

	const txn = encoder.create({
	    Verb: 'inc',
	    Name: INT_NAME,
	    Value: 1
	})

	const txn1 = encoder.create({
	    Verb: 'inc',
	    Name: INT_NAME,
	    Value: 1
	})

	const txn2 = encoder.create({
	    Verb: 'inc',
	    Name: INT_NAME,
	    Value: 1
	})


	const {BatchEncoder} = require('sawtooth-sdk')

	const batcher = new BatchEncoder(privateKey)

	const batch = batcher.create([txn])
	const batch2 = batcher.create([txn1, txn2])
	//const batch3 = batcher.create(txnBytes)

	const batchBytes = batcher.encode([batch, batch2])
    return batchBytes
}

function calculateAddress(family, name) {

	const crypto = require('crypto')

	const _hash = (x) =>
	  crypto.createHash('sha512').update(x).digest('hex').toLowerCase()

	const INT_KEY_NAMESPACE = _hash(family).substring(0, 6)
	let address = INT_KEY_NAMESPACE + _hash(name).slice(-64)
	console.log(address)
	return address
}

function submitBatches(batchBytes) {
	const request = require('request')
	request.post({
		url: 'http://127.0.0.1:8080/batches',
		body: batchBytes,
		headers: {'Content-Type': 'application/octet-stream'}
	}, (err, response) => {
		if (err) return console.log(err)
		console.log(response.body)

		var link = JSON.parse(response.body).link

		var hasPending = false
		var interval = setInterval(function(){
			console.log(link)
        	request.get(link, (err, response) => {
        		if (err) return console.log(err)
    			batchStatuses = JSON.parse(response.body).data
    			console.log(batchStatuses)
    			console.log('\n\n')

    			hasPending = false
    			for (index in batchStatuses){
    				batchStatus = batchStatuses[index].status
    				console.log('batchStatus: ' + batchStatus)
					if (batchStatus == 'PENDING'){
    					hasPending = true
    					break
    				}
    			}
//    			batchStatuses.forEach(function(value, index){
//        			console.log(value)
//        			if (value.status == 'PENDING'){
//    					console.log('value.status: ' + value.status)
//    					hasPending = true
//    				}
//        		})
        		console.log('hasPending: ' + hasPending)
        		if (hasPending != true){
        			console.log('hasPending != true')
        			clearInterval(interval)
        		}
        	})
		}, 1000);


		setTimeout(function(){
			console.log('timeout')
			clearInterval(interval)
		}, 5000)
	})
}


function submitBatchesInFile(address) {
	const fs = require('fs')
	fs.readFile('batches.intkey', function(err, buffer) {
		if (err) throw err
		submitBatches(buffer)
	})
}

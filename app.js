const API_BASE = "https://d6yuohmtl7.execute-api.us-east-1.amazonaws.com/dev"

async function runScan() {

  await fetch(API_BASE + "/scan", {
    method: "POST"
  })

  alert("Security scan completed")

  loadInstances()
  loadBuckets()
  loadCIS()
}

async function loadInstances() {

  const res = await fetch(API_BASE + "/instances")
  const data = await res.json()

  const instances = data.body ? JSON.parse(data.body) : data

  const table = document.querySelector("#instancesTable tbody")

  table.innerHTML = ""

  instances.forEach(i => {

    const row = `
      <tr>
        <td>${i.instanceId}</td>
        <td>${i.instanceType}</td>
        <td>${i.publicIp || "-"}</td>
        <td>${i.securityGroups.map(g => g.GroupName).join(", ")}</td>
      </tr>
    `

    table.innerHTML += row

  })

}

async function loadBuckets() {

  const res = await fetch(API_BASE + "/buckets")
  const data = await res.json()

  const buckets = data.body ? JSON.parse(data.body) : data

  const table = document.querySelector("#bucketsTable tbody")

  table.innerHTML = ""

  buckets.forEach(b => {

    const row = `
      <tr>
        <td>${b.bucketName}</td>
        <td>${b.createdAt}</td>
      </tr>
    `

    table.innerHTML += row

  })

}

async function loadCIS() {

  const res = await fetch(API_BASE + "/cis-results")
  const data = await res.json()

  const results = data.body ? JSON.parse(data.body) : data

  const table = document.querySelector("#cisTable tbody")

  table.innerHTML = ""

  results.forEach(r => {

    const color = r.status === "PASS" ? "green" : "red"

    const row = `
      <tr>
        <td>${r.resource_id}</td>
        <td>${r.check_name}</td>
        <td style="color:${color}; font-weight:bold;">
          ${r.status}
        </td>
        <td>${r.evidence}</td>
        <td>${r.timestamp}</td>
      </tr>
    `

    table.innerHTML += row

  })

}

loadInstances()
loadBuckets()
loadCIS()


setInterval(() => {

  loadInstances()
  loadBuckets()
  loadCIS()

}, 30000)

const API_BASE = CONFIG.API_BASE

function showStatus(message, type) {
  const statusEl = document.getElementById("statusMsg")
  statusEl.textContent = message

  statusEl.className = ""         
  if (type) {
    statusEl.className = type     
  }
}

function parseResponse(data) {
  if (data.body) {
    return JSON.parse(data.body)
  }
  return data
}


async function loadInstances() {

  try {

    const response = await fetch(API_BASE + "/instances")
    const data = await response.json()

    const instances = parseResponse(data)
    const tableBody = document.querySelector("#instancesTable tbody")

    tableBody.innerHTML = ""

    if (instances.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4">No EC2 instances found</td></tr>'
      return
    }

    instances.forEach(function(instance) {
      const securityGroupNames = instance.securityGroups
        .map(function(group) { return group.GroupName })
        .join(", ")

      const row = document.createElement("tr")
      row.innerHTML =
        "<td>" + instance.instanceId + "</td>" +
        "<td>" + instance.instanceType + "</td>" +
        "<td>" + (instance.publicIp || "-") + "</td>" +
        "<td>" + securityGroupNames + "</td>"

      tableBody.appendChild(row)

    })

  } catch (error) {
    console.error("EC2 load failed:", error)
    document.querySelector("#instancesTable tbody").innerHTML =
      '<tr><td colspan="4" style="color:red;">Failed to load EC2 data</td></tr>'
  }

}


async function loadBuckets() {

  try {

    const response = await fetch(API_BASE + "/buckets")
    const data = await response.json()
    const buckets = parseResponse(data)

    const tableBody = document.querySelector("#bucketsTable tbody")
    tableBody.innerHTML = ""

    if (buckets.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="2">No S3 buckets found</td></tr>'
      return
    }

    buckets.forEach(function(bucket) {

      const date = new Date(bucket.createdAt)
      const formattedDate = date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })

      const row = document.createElement("tr")
      row.innerHTML =
        "<td>" + bucket.bucketName + "</td>" +
        "<td>" + formattedDate + "</td>"

      tableBody.appendChild(row)

    })

  } catch (error) {
    console.error("S3 load failed:", error)
    document.querySelector("#bucketsTable tbody").innerHTML =
      '<tr><td colspan="2" style="color:red;">Failed to load S3 data</td></tr>'
  }

}


async function loadCIS() {

  try {

    const response = await fetch(API_BASE + "/cis-results")
    const data = await response.json()
    const parsed = parseResponse(data)

    const results = parsed.results || parsed
    const summary = parsed.summary || null

    if (summary) {
      const t = document.getElementById("totalCount")
      const p = document.getElementById("passCount")
      const f = document.getElementById("failCount")
      if (t) t.textContent = summary.total
      if (p) p.textContent = summary.passed
      if (f) f.textContent = summary.failed
    }

    const tableBody = document.querySelector("#cisTable tbody")
    tableBody.innerHTML = ""

    if (!results || results.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">No scan results yet — click Run Security Scan</td></tr>'
      return
    }

    results.forEach(function(result) {

      const statusClass = result.status === "PASS"  ? "status-pass"
                        : result.status === "FAIL"  ? "status-fail"
                        : "status-error"

      const formattedDate = new Date(result.timestamp).toLocaleString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })

      const row = document.createElement("tr")
      row.innerHTML =
        "<td>" + result.resource_id + "</td>" +
        "<td>" + result.check_name + "</td>" +
        '<td class="' + statusClass + '">' + result.status + "</td>" +
        "<td>" + result.evidence + "</td>" +
        "<td>" + formattedDate + "</td>"

      tableBody.appendChild(row)
    })

  } catch (error) {
    console.error("CIS load failed:", error)
    document.querySelector("#cisTable tbody").innerHTML =
      '<tr><td colspan="5" style="color:red;">Failed to load scan results</td></tr>'
  }

}


async function runScan() {

  const button = document.getElementById("scanBtn")
  button.disabled = true
  button.textContent = "Scanning..."

  showStatus("Running security scan... please wait", "loading")

  try {

    await fetch(API_BASE + "/scan", { method: "POST" })

    showStatus("Scan completed! Refreshing data...", "success")

    await loadInstances()
    await loadBuckets()
    await loadCIS()

    showStatus("Dashboard updated with latest scan results", "success")

  } catch (error) {
    console.error("Scan failed:", error)
    showStatus("Scan failed. Please try again.", "error")
  }

  button.disabled = false
  button.textContent = "Run Security Scan"

}


loadInstances()
loadBuckets()
loadCIS()

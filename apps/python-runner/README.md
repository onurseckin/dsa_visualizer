# Python runner boundary

The runner executes authored learning exercises in a short-lived process group
inside the local Docker service. It applies resource, request, output, and result
limits; blocks Python's audited process-creation APIs; and terminates the owned
process group after every success, error, cancellation, or timeout.

This is stability containment for a local educational playground, not a
hostile-code sandbox. The Docker boundary remains authoritative. In particular,
native extensions can operate below Python's audit hooks, so the container
configuration should retain its process, filesystem, capability, and syscall
restrictions.

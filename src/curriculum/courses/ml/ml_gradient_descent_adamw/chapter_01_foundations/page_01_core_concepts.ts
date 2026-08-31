import type { CoursePage } from "../../../../courseTypes";

export const page_01_core_concepts: CoursePage = {
  id: "ml_gradient_descent_adamw_c1_p1",
  pageNumber: 1,
  title: "Gradient Descent, Momentum, & Decoupled AdamW",
  subtitle: "First-Order Dynamics, Ravine Conditioning, and Decoupled Weight Decay Mechanics",
  estimatedMinutes: 30,
  sections: [
    {
      type: "prose",
      title: "Optimization Dynamics on High-Dimensional Loss Manifolds",
      content:
        "Optimization of deep neural networks is characterized by non-convex, ill-conditioned loss surfaces with sharp ravines and saddle points (Stanford CS336 / CS229). On a local quadratic approximation $\\mathcal{L}(\\theta) \\approx \\frac{1}{2} \\theta^T H \\theta$, the convergence of vanilla Stochastic Gradient Descent (SGD) $\\theta_{t+1} = \\theta_t - \\eta g_t$ is strictly bounded by the Hessian condition number:\n$$\\kappa = \\frac{\\lambda_{\\max}(H)}{\\lambda_{\\min}(H)}$$\nWhen $\\kappa \\gg 1$, the gradient points almost orthogonally to the direction of the minimum, forcing SGD to oscillate violently across steep ravine walls while making negligible progress along the flat ravine floor.\n\nTo overcome this, modern optimization evolved through four algorithmic milestones:\n1. **Polyak Heavy-Ball Momentum**: Introduces inertia via an Exponential Moving Average (EMA) of gradients: $m_t = \\beta m_{t-1} + g_t$, dampening high-frequency oscillations.\n2. **Nesterov Accelerated Gradient (NAG)**: Evaluates gradients at the projected lookahead point $\\theta_t - \\beta m_{t-1}$, providing anticipatory braking.\n3. **AdaGrad & RMSProp**: Scales updates by coordinate-wise second-moment variance estimates $v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2$, normalizing gradient magnitudes across heterogeneous feature frequencies.\n4. **AdamW (Loshchilov & Hutter, 2017)**: Discovered that standard Adam erroneously applies $L_2$ regularization $\\mathcal{L}(\\theta) + \\frac{1}{2} \\lambda \\|\\theta\\|^2$ directly to the gradient $g_t \\leftarrow g_t + \\lambda \\theta_t$, causing weights with small or sparse gradients to be regularized far more aggressively than weights with large gradients ($g_t / \\sqrt{v_t}$). AdamW completely decouples weight decay from the gradient update step:\n$$\\theta_{t+1} = \\theta_t - \\eta_t \\lambda \\theta_t - \\frac{\\eta_t}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t$$",
    },
    {
      type: "mental_model",
      title: "Anisotropic Quadratic Ravine Trajectories",
      visualIntuition:
        "Loss Contour Ellipse (lambda_max = 100 on y-axis, lambda_min = 1 on x-axis):\n   y ^\n     |      /\\  /\\  /\\  /\\    <-- Vanilla SGD: High-frequency oscillation\n     |     /  \\/  \\/  \\/  \\       across steep y-axis, stalling x-progress.\n     |    /                \\\n     +------------------------> x (True valley minimum)\n\nPolyak Momentum (Heavy Ball):\n  Inertia cancels out opposite-direction y-axis oscillations while\n  monotonically accumulating velocity along the consistent x-axis.\n\nAdamW Decoupled Dynamics:\n  1. First moment m_t computes directional trajectory.\n  2. Second moment v_t rescales step-size so y-axis step is divided by sqrt(100)=10,\n     and x-axis step is divided by sqrt(1)=1 -> Isotropic spherical update!\n  3. Decoupled decay (-eta * lambda * theta) shrinks weights uniformly toward origin\n     WITHOUT passing through the 1/sqrt(v_t) denominator distortion.",
      invariant:
        "Decoupled Weight Decay Invariant: Weight decay magnitude is strictly proportional to parameter value and learning rate: Delta theta_decay = - eta * lambda * theta, unaffected by gradient scaling.",
      stateTransitions:
        "Stochastic Gradient g_t -> EMA First Moment m_t -> EMA Second Moment v_t -> Bias Corrections (m_hat, v_hat) -> Decoupled Decay -> Parameter Update.",
      naiveBottleneck:
        "Adam with L2 regularization divides the regularization gradient (lambda * theta) by sqrt(v_t), suppressing weight decay on frequently updated weights.",
      optimalInsight:
        "AdamW applies weight decay directly to parameters, preserving proper regularization dynamics across all parameter groups and dramatically improving generalization.",
    },
    {
      type: "math_proof",
      title: "Convergence Rate of Gradient Descent on L-Smooth Convex Functions",
      theorem:
        "Let $f: \\mathbb{R}^d \\to \\mathbb{R}$ be $L$-smooth (\\|\\nabla f(x) - \\nabla f(y)\\| \\le L \\|x - y\\|) and $\\mu$-strongly convex (\\nabla^2 f(x) \\succeq \\mu I). With constant step size $\\eta = 1/L$, gradient descent $x_{t+1} = x_t - \\eta \\nabla f(x_t)$ achieves linear (geometric) convergence:\n$$\\|x_t - x^*\\|_2 \\le \\left( 1 - \\frac{\\mu}{L} \\right)^t \\|x_0 - x^*\\|_2 = \\left( 1 - \\frac{1}{\\kappa} \\right)^t \\|x_0 - x^*\\|_2$$",
      proof:
        "1. By strong convexity and $L$-smoothness, for all $x, y \\in \\mathbb{R}^d$, we have the co-coercivity inequality:\n   $$\\langle \\nabla f(x) - \\nabla f(y), x - y \\rangle \\ge \\frac{\\mu L}{\\mu + L} \\|x - y\\|^2 + \\frac{1}{\\mu + L} \\|\\nabla f(x) - \\nabla f(y)\\|^2$$\n2. Setting $y = x^*$ (where $\\nabla f(x^*) = 0$) and $x = x_t$:\n   $$\\langle \\nabla f(x_t), x_t - x^* \\rangle \\ge \\frac{\\mu L}{\\mu + L} \\|x_t - x^*\\|^2 + \\frac{1}{\\mu + L} \\|\\nabla f(x_t)\\|^2$$\n3. Consider the squared distance to the optimum at step $t+1$ with $\\eta = 1/L$:\n   $$\\|x_{t+1} - x^*\\|^2 = \\|x_t - \\frac{1}{L} \\nabla f(x_t) - x^*\\|^2 = \\|x_t - x^*\\|^2 - \\frac{2}{L} \\langle \\nabla f(x_t), x_t - x^* \\rangle + \\frac{1}{L^2} \\|\\nabla f(x_t)\\|^2$$\n4. Substitute the co-coercivity lower bound into the inner product term:\n   $$\\|x_{t+1} - x^*\\|^2 \\le \\|x_t - x^*\\|^2 - \\frac{2}{L} \\left( \\frac{\\mu L}{\\mu + L} \\|x_t - x^*\\|^2 + \\frac{1}{\\mu + L} \\|\\nabla f(x_t)\\|^2 \\right) + \\frac{1}{L^2} \\|\\nabla f(x_t)\\|^2$$\n   $$= \\left( 1 - \\frac{2\\mu}{\\mu + L} \\right) \\|x_t - x^*\\|^2 + \\left( \\frac{1}{L^2} - \\frac{2}{L(\\mu + L)} \\right) \\|\\nabla f(x_t)\\|^2$$\n5. For $\\mu \\le L$, the second coefficient satisfies $\\frac{1}{L^2} - \\frac{2}{L(\\mu + L)} = \\frac{\\mu - L}{L^2(\\mu + L)} \\le 0$. Dropping this negative term:\n   $$\\|x_{t+1} - x^*\\|^2 \\le \\left( 1 - \\frac{2\\mu}{\\mu + L} \\right) \\|x_t - x^*\\|^2 \\le \\left( 1 - \\frac{\\mu}{L} \\right)^2 \\|x_t - x^*\\|^2$$\n6. Taking square roots and applying recursively from $t=0$ establishes $\\|x_t - x^*\\| \\le \\left( 1 - \\frac{1}{\\kappa} \\right)^t \\|x_0 - x^*\\|$, proving that convergence is directly throttled by condition number $\\kappa = L / \\mu$.",
    },
  ],
};

class BaseNode:
    """
    Classe base para todos os nós de processamento do pipeline.
    """
    def __init__(self, node_info: dict):
        self.node_id = node_info['id']
        self.node_type = node_info['type']
        # 'data' contém as configurações específicas do nó definidas no frontend
        self.config = node_info.get('data', {})

    def execute(self, frame, input_data: dict, shared_tools: dict) -> dict:
        """
        Executa a lógica do nó.

        :param frame: O frame de vídeo original.
        :param input_data: Dicionário com os resultados dos nós que se conectam a este.
        :param shared_tools: Dicionário com ferramentas compartilhadas (modelos, etc.).
        :return: Um dicionário com os resultados deste nó.
        """
        raise NotImplementedError("Cada nó deve implementar o método 'execute'")